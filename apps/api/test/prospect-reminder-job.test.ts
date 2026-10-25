import {
  prospectCallLoggedResponse,
  prospectCompanyResponse,
  prospectContactResponse,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { createD1ReminderRepository } from "../src/contexts/sales/infrastructure/d1-reminder-repository";
import { handleScheduled } from "../src/jobs/scheduled";
import { sendProspectReminders } from "../src/jobs/send-prospect-reminders";
import { createDatabase } from "../src/platform/database";
import { signInAsAdmin } from "./admin-session";
import { TestExecutionContext } from "./test-execution-context";
import { APP_URL, startTestPlatform, type TestPlatform } from "./test-platform";

let platform: TestPlatform;
let sales: string;
let company: z.infer<typeof prospectCompanyResponse>;
let contact: z.infer<typeof prospectContactResponse>;

const send = (path: string, method: string, body?: unknown) =>
  platform.request(
    `/api/admin${path}`,
    body === undefined ? { method } : { method, body: JSON.stringify(body) },
    sales,
  );

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

const planCallback = async (dueInMinutes: number, notify: string) => {
  const response = await send(`/prospects/companies/${company.id}/calls`, "POST", {
    contactId: contact.id,
    outcome: "answered",
    nextAction: "callback",
    schedule: { dueAt: minutesFromNow(dueInMinutes), notify },
    notes: "Veut en parler à son associé",
  });
  expect(response.status).toBe(201);
  const taskId = prospectCallLoggedResponse.parse(await response.json()).taskId;
  if (taskId === null) {
    throw new Error("callback_without_task");
  }
  return taskId;
};

const reminderLogs = () =>
  platform
    .loggedLines()
    .filter((line) => line.includes('"kind":"prospect_reminder"'))
    .map((line) => z.object({ url: z.string() }).parse(JSON.parse(line)));

const runLogs = () =>
  platform.loggedLines().filter((line) => line.includes('"event":"prospect_reminders_run"'));

const collectingExecutionContext = () => {
  const pending: Promise<unknown>[] = [];
  const base = new TestExecutionContext();
  const context: ExecutionContext = {
    exports: base.exports,
    props: base.props,
    waitUntil: (promise) => {
      pending.push(promise);
    },
    passThroughOnException: () => undefined,
    abort: () => undefined,
    get tracing() {
      return base.tracing;
    },
  };
  return { context, pending };
};

beforeAll(async () => {
  platform = await startTestPlatform();
  sales = await signInAsAdmin(platform, "antho-rappels@passalio.com", "sales");
  const created = await send("/prospects/companies", "POST", {
    name: "KH Ramonage",
    city: "Ivry-sur-Seine",
    department: "94",
    phone: "01 46 00 00 00",
  });
  company = prospectCompanyResponse.parse(await created.json());
  const added = await send(`/prospects/companies/${company.id}/contacts`, "POST", {
    firstName: "Karim",
    lastName: "Haddad",
    mobile: "06 12 34 56 78",
    isMain: true,
  });
  contact = prospectContactResponse.parse(await added.json());
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("prospect reminder job", () => {
  it("finds a due reminder with its contact, note, phone and the owner's address", async () => {
    const taskId = await planCallback(10, "minutes_15");

    const due = await createD1ReminderRepository(createDatabase(platform.env.DB)).due(
      new Date(),
      50,
    );

    expect(due).toEqual([
      {
        taskId,
        kind: "callback",
        notify: "minutes_15",
        dueAt: expect.any(Date),
        company: { id: company.id, name: "KH Ramonage", city: "Ivry-sur-Seine" },
        contactName: "Karim Haddad",
        phone: "06 12 34 56 78",
        lastNote: { text: "Veut en parler à son associé", at: expect.any(Date) },
        interest: null,
        teamSize: null,
        toolKind: null,
        recipient: "antho-rappels@passalio.com",
      },
    ]);
  });

  it("mails the due reminder once, with a link to the company file", async () => {
    const first = await sendProspectReminders(platform.env);
    const second = await sendProspectReminders(platform.env);

    expect(first.sentTaskIds).toHaveLength(1);
    expect(second.sentTaskIds).toEqual([]);
    expect(reminderLogs()).toEqual([
      expect.objectContaining({ url: `${APP_URL}/admin/entreprises/${company.id}` }),
    ]);
  });

  it("waits for reminders that are not due yet and never sends those without notification", async () => {
    await planCallback(60, "minutes_15");
    await planCallback(-5, "none");

    const run = await sendProspectReminders(platform.env);

    expect(run).toEqual({ sentTaskIds: [], skipped: [], failedTaskIds: [] });
  });

  it("sends to the reminder address of the member's mail settings", async () => {
    const meResponse = z.object({ admin: z.object({ userId: z.string() }) });
    const me = meResponse.parse(await (await send("/me", "GET")).json()).admin.userId;
    const saved = await send(`/mail-settings/${me}`, "PUT", {
      senderName: "Antho, Passalio",
      senderAddress: "antho@passalio.fr",
      replyTo: "",
      provider: "ovh_email_pro",
      smtpHost: "pro1.mail.ovh.net",
      smtpPort: 587,
      smtpUsername: "antho@passalio.fr",
      smtpPassword: "mot-de-passe-application",
      signature: "",
      reminderNotify: "minutes_15",
      reminderAddress: "rappels-antho@passalio.fr",
    });
    expect(saved.status).toBe(204);
    const taskId = await planCallback(0, "at_time");

    const due = await createD1ReminderRepository(createDatabase(platform.env.DB)).due(
      new Date(),
      50,
    );

    expect(due.map(({ taskId: id, recipient }) => ({ id, recipient }))).toEqual([
      { id: taskId, recipient: "rappels-antho@passalio.fr" },
    ]);
  });

  it("runs from the Worker cron with its own trace and no personal data in the logs", async () => {
    const { context, pending } = collectingExecutionContext();

    await handleScheduled(
      { cron: "*/5 * * * *", scheduledTime: Date.now(), noRetry: () => undefined },
      platform.env,
      context,
    );
    await Promise.all(pending);

    const lastRun = z
      .object({ trace_id: z.string().min(1), sent: z.number() })
      .parse(JSON.parse(runLogs().at(-1) ?? "{}"));
    expect(lastRun.sent).toBe(1);
    const logged = platform.loggedLines().join("\n");
    for (const personal of ["Karim", "Haddad", "06 12 34 56 78", "rappels-antho", "associé"]) {
      expect(logged).not.toContain(personal);
    }
  });
});
