import {
  prospectCallLoggedResponse,
  prospectCallSeriesResponse,
  prospectCompanyFileResponse,
  prospectCompanyResponse,
  prospectContactResponse,
  prospectFollowUpResponse,
  prospectMyDayResponse,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "./admin-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const UNKNOWN_ID = "0199c8a4-0000-7000-8000-000000000000";
const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

let platform: TestPlatform;
let admin: string;
let sales: string;
let gilles: z.infer<typeof prospectCompanyResponse>;
let gazHop: z.infer<typeof prospectCompanyResponse>;
let valDeMarne: z.infer<typeof prospectCompanyResponse>;
let gillesContact: z.infer<typeof prospectContactResponse>;

const send = (cookie: string, path: string, method: string, body?: unknown) =>
  platform.request(
    `/api/admin/prospects${path}`,
    body === undefined ? { method } : { method, body: JSON.stringify(body) },
    cookie,
  );

const read = async <Schema extends z.ZodType>(cookie: string, path: string, schema: Schema) => {
  const response = await send(cookie, path, "GET");
  expect(response.status).toBe(200);
  return schema.parse(await response.json());
};

const created = async <Schema extends z.ZodType>(response: Response, schema: Schema) => {
  expect(response.status).toBe(201);
  return schema.parse(await response.json());
};

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

const createCompany = async (body: Record<string, unknown>) =>
  created(await send(admin, "/companies", "POST", body), prospectCompanyResponse);

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

beforeAll(async () => {
  platform = await startTestPlatform();
  admin = await signInAsAdmin(platform, "quentin-appels@passalio.com");
  sales = await signInAsAdmin(platform, "antho-appels@passalio.com", "sales");
  gilles = await createCompany({
    name: "Entreprise Sauvageot Gilles",
    city: "Alfortville",
    department: "94",
    phone: "01 43 00 00 00",
  });
  gazHop = await createCompany({ name: "Gaz Hop", department: "94", phone: "01 43 11 11 11" });
  valDeMarne = await createCompany({ name: "Ramonage du Val", department: "75", phone: "01 40" });
  await createCompany({ name: "Sans Téléphone", department: "94" });
  gillesContact = await created(
    await send(admin, `/companies/${gilles.id}/contacts`, "POST", {
      firstName: "Gilles",
      lastName: "Sauvageot",
      isMain: true,
    }),
    prospectContactResponse,
  );
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("call series", () => {
  it("lists the open companies with a phone that were never called, by name", async () => {
    const series = await read(sales, "/call-series?department=94", prospectCallSeriesResponse);
    expect(series.companies.map(({ name }) => name)).toEqual([
      "Entreprise Sauvageot Gilles",
      "Gaz Hop",
    ]);
    expect(series.companies[0]).toMatchObject({
      mainContact: { id: gillesContact.id, name: "Gilles Sauvageot" },
      lastCallAt: null,
      lastCallOutcome: null,
    });
  });

  it("refuses an unknown target", async () => {
    expect((await send(sales, "/call-series?target=everyone", "GET")).status).toBe(400);
  });
});

describe("logging a call", () => {
  it("logs an answered call that plans a callback, qualifies the company and fills my day", async () => {
    const logged = await created(
      await send(sales, `/companies/${gilles.id}/calls`, "POST", {
        contactId: gillesContact.id,
        outcome: "answered",
        nextAction: "callback",
        schedule: { dueAt: minutesFromNow(-30), notify: "at_time" },
        notes: "Rappeler après sa tournée",
      }),
      prospectCallLoggedResponse,
    );
    expect(logged.stage).toBe("qualified");
    expect(logged.taskId).not.toBeNull();

    const followUp = await read(
      sales,
      `/companies/${gilles.id}/follow-up`,
      prospectFollowUpResponse,
    );
    expect(followUp.lastCall).toMatchObject({ outcome: "answered", by: { name: "antho-appels" } });
    expect(followUp.calls).toEqual([
      expect.objectContaining({
        id: logged.id,
        contact: { id: gillesContact.id, name: "Gilles Sauvageot" },
        nextAction: "callback",
        notes: "Rappeler après sa tournée",
      }),
    ]);
    expect(followUp.tasks).toEqual([
      expect.objectContaining({ id: logged.taskId, kind: "callback", status: "open" }),
    ]);

    const myDay = await read(sales, "/my-day", prospectMyDayResponse);
    expect(myDay.tasks.map(({ id }) => id)).toEqual([logged.taskId]);
    expect(myDay.tasks[0]?.company).toEqual({
      id: gilles.id,
      name: "Entreprise Sauvageot Gilles",
      city: "Alfortville",
      phone: "01 43 00 00 00",
    });
    expect(myDay.counts).toEqual({ overdue: 1, today: 0, callsToday: 1 });
    expect((await read(admin, "/my-day", prospectMyDayResponse)).tasks).toEqual([]);

    const file = await read(admin, `/companies/${gilles.id}`, prospectCompanyFileResponse);
    expect(file.company.stage).toBe("qualified");
    expect(file.events[0]).toMatchObject({ kind: "stage_changed", toStage: "qualified" });
  });

  it("moves a company that did not answer to the not reached series", async () => {
    await created(
      await send(sales, `/companies/${gazHop.id}/calls`, "POST", { outcome: "voicemail" }),
      prospectCallLoggedResponse,
    );
    const notReached = await read(
      sales,
      "/call-series?target=not_reached",
      prospectCallSeriesResponse,
    );
    expect(notReached.companies.map(({ id, lastCallOutcome }) => [id, lastCallOutcome])).toEqual([
      [gazHop.id, "voicemail"],
    ]);
    const neverCalled = await read(sales, "/call-series?department=94", prospectCallSeriesResponse);
    expect(neverCalled.companies).toEqual([]);
  });

  it("plans a demo and moves the company to demo planned", async () => {
    const logged = await created(
      await send(sales, `/companies/${valDeMarne.id}/calls`, "POST", {
        outcome: "answered",
        nextAction: "demo",
        schedule: { dueAt: minutesFromNow(60 * 24 * 3), notify: "day_before" },
      }),
      prospectCallLoggedResponse,
    );
    expect(logged.stage).toBe("demo_planned");
    const followUp = await read(
      admin,
      `/companies/${valDeMarne.id}/follow-up`,
      prospectFollowUpResponse,
    );
    expect(followUp.tasks).toEqual([
      expect.objectContaining({ kind: "demo", notify: "day_before" }),
    ]);
    expect(followUp.tasks[0]?.notifyAt).not.toBeNull();
  });

  it.each([
    ["a callback without a date", { outcome: "answered", nextAction: "callback" }],
    [
      "a date without a callback",
      {
        outcome: "answered",
        nextAction: "email",
        schedule: { dueAt: "2026-10-27T09:30:00.000Z", notify: "none" },
      },
    ],
    ["an unknown outcome", { outcome: "busy" }],
    [
      "a date that is not a date",
      {
        outcome: "answered",
        nextAction: "callback",
        schedule: { dueAt: "mardi", notify: "none" },
      },
    ],
  ])("refuses %s", async (_, body) => {
    expect((await send(sales, `/companies/${gilles.id}/calls`, "POST", body)).status).toBe(400);
  });

  it("refuses a contact of another company", async () => {
    const response = await send(sales, `/companies/${gazHop.id}/calls`, "POST", {
      contactId: gillesContact.id,
      outcome: "answered",
    });
    expect(response.status).toBe(422);
    expect(await errorOf(response)).toBe("contact_not_in_company");
  });

  it("answers not found for an unknown company", async () => {
    const response = await send(sales, `/companies/${UNKNOWN_ID}/calls`, "POST", {
      outcome: "answered",
    });
    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("company_not_found");
  });
});

describe("qualification", () => {
  it("saves the answers and clears one set to null", async () => {
    const path = `/companies/${gilles.id}/qualification`;
    expect(
      (await send(sales, path, "PATCH", { interest: "hot", teamSize: "solo", toolKind: "paper" }))
        .status,
    ).toBe(204);
    expect((await send(sales, path, "PATCH", { toolKind: null })).status).toBe(204);
    const followUp = await read(
      sales,
      `/companies/${gilles.id}/follow-up`,
      prospectFollowUpResponse,
    );
    expect(followUp.qualification).toEqual({
      interest: "hot",
      teamSize: "solo",
      toolKind: null,
      certificateVolume: null,
      decisionMaker: null,
    });
  });

  it("refuses an empty or unknown answer", async () => {
    const path = `/companies/${gilles.id}/qualification`;
    expect((await send(sales, path, "PATCH", {})).status).toBe(400);
    expect((await send(sales, path, "PATCH", { interest: "brulant" })).status).toBe(400);
  });

  it("answers not found for an unknown company", async () => {
    const response = await send(sales, `/companies/${UNKNOWN_ID}/qualification`, "PATCH", {
      interest: "hot",
    });
    expect(response.status).toBe(404);
  });
});

describe("tasks", () => {
  it("moves a callback, then marks it done and takes it out of my day", async () => {
    const [task] = (await read(sales, "/my-day", prospectMyDayResponse)).tasks;
    const path = `/tasks/${task?.id ?? UNKNOWN_ID}`;
    expect(
      (
        await send(sales, path, "PATCH", {
          schedule: { dueAt: minutesFromNow(-5), notify: "minutes_15" },
        })
      ).status,
    ).toBe(204);
    const moved = await read(sales, "/my-day", prospectMyDayResponse);
    expect(moved.tasks).toEqual([expect.objectContaining({ id: task?.id, notify: "minutes_15" })]);

    expect((await send(sales, path, "PATCH", { status: "done" })).status).toBe(204);
    expect((await read(sales, "/my-day", prospectMyDayResponse)).tasks).toEqual([]);

    const closed = await send(sales, path, "PATCH", { status: "cancelled" });
    expect(closed.status).toBe(409);
    expect(await errorOf(closed)).toBe("task_closed");
  });

  it("refuses an empty change", async () => {
    expect((await send(sales, `/tasks/${UNKNOWN_ID}`, "PATCH", {})).status).toBe(400);
  });

  it("answers not found for an unknown task", async () => {
    const response = await send(sales, `/tasks/${UNKNOWN_ID}`, "PATCH", { status: "done" });
    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("task_not_found");
  });

  it("deletes the calls and tasks with their company", async () => {
    expect((await send(admin, `/companies/${valDeMarne.id}`, "DELETE")).status).toBe(204);
    expect((await send(admin, `/companies/${valDeMarne.id}/follow-up`, "GET")).status).toBe(404);
    const remaining = await platform.env.DB.prepare(
      "SELECT (SELECT count(*) FROM prospect_calls WHERE company_id = ?1) + (SELECT count(*) FROM prospect_tasks WHERE company_id = ?1) + (SELECT count(*) FROM prospect_follow_ups WHERE company_id = ?1) AS rows",
    )
      .bind(valDeMarne.id)
      .first<{ rows: number }>();
    expect(remaining?.rows).toBe(0);
  });
});
