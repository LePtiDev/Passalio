import {
  mailboxTestResponse,
  mailSettingsResponse,
  type MailSettingsChange,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "./admin-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const meResponse = z.object({ admin: z.object({ userId: z.string() }) });

const PASSWORD = "mot-de-passe-application-ovh";

let platform: TestPlatform;
let quentin: string;
let antho: string;
let anthoId: string;
let quentinId: string;

const change = (overrides: Partial<MailSettingsChange> = {}) => ({
  senderName: "Antho, Passalio",
  senderAddress: "antho@passalio.fr",
  replyTo: "",
  provider: "ovh_email_pro",
  smtpHost: "pro1.mail.ovh.net",
  smtpPort: 587,
  smtpUsername: "antho@passalio.fr",
  smtpPassword: PASSWORD,
  signature: "Antho\nPassalio",
  reminderNotify: "minutes_15",
  reminderAddress: "",
  ...overrides,
});

const send = (cookie: string, path: string, method: string, body?: unknown) =>
  platform.request(
    `/api/admin/mail-settings${path}`,
    body === undefined ? { method } : { method, body: JSON.stringify(body) },
    cookie,
  );

const idOf = async (cookie: string) => {
  const response = await platform.request("/api/admin/me", { method: "GET" }, cookie);
  return meResponse.parse(await response.json()).admin.userId;
};

const settingsOf = async (cookie: string, userId: string) => {
  const response = await send(cookie, `/${userId}`, "GET");
  expect(response.status).toBe(200);
  const text = await response.text();
  expect(text).not.toContain(PASSWORD);
  return mailSettingsResponse.parse(JSON.parse(text));
};

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

beforeAll(async () => {
  platform = await startTestPlatform();
  quentin = await signInAsAdmin(platform, "quentin-boite@passalio.com");
  antho = await signInAsAdmin(platform, "antho-boite@passalio.com", "sales");
  anthoId = await idOf(antho);
  quentinId = await idOf(quentin);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("mail settings routes", () => {
  it("shows a member with no mailbox yet", async () => {
    const settings = await settingsOf(antho, anthoId);
    expect(settings).toEqual({
      userId: anthoId,
      member: { name: expect.any(String), email: "antho-boite@passalio.com" },
      settings: null,
    });
  });

  it("asks for the application password on the first save", async () => {
    const response = await send(antho, `/${anthoId}`, "PUT", change({ smtpPassword: undefined }));
    expect(response.status).toBe(422);
    expect(await errorOf(response)).toBe("password_required");
  });

  it("refuses port 25 and an unknown provider", async () => {
    expect((await send(antho, `/${anthoId}`, "PUT", { ...change(), smtpPort: 25 })).status).toBe(
      400,
    );
    expect(
      (await send(antho, `/${anthoId}`, "PUT", { ...change(), provider: "laposte" })).status,
    ).toBe(400);
  });

  it("saves the mailbox, never sends the password back, and stores it sealed", async () => {
    expect((await send(antho, `/${anthoId}`, "PUT", change())).status).toBe(204);
    const { settings } = await settingsOf(antho, anthoId);
    expect(settings).toMatchObject({
      senderAddress: "antho@passalio.fr",
      replyTo: null,
      smtpHost: "pro1.mail.ovh.net",
      smtpPort: 587,
      hasPassword: true,
      verifiedAt: null,
      signature: "Antho\nPassalio",
      reminderAddress: null,
      updatedBy: { id: anthoId },
    });
    const stored = await platform.env.DB.prepare(
      "SELECT smtp_password_cipher FROM platform_mail_settings WHERE user_id = ?",
    )
      .bind(anthoId)
      .first<{ smtp_password_cipher: string }>();
    expect(stored?.smtp_password_cipher).toMatch(/^v1:/);
    expect(stored?.smtp_password_cipher).not.toContain(PASSWORD);
  });

  it("tests the mailbox and remembers that it works", async () => {
    const response = await send(antho, `/${anthoId}/test`, "POST");
    expect(response.status).toBe(200);
    const tested = mailboxTestResponse.parse(await response.json());
    expect(tested.sentTo).toBe("antho@passalio.fr");
    const { settings } = await settingsOf(antho, anthoId);
    expect(settings?.verifiedAt).toBe(tested.verifiedAt);
  });

  it("says when there is no mailbox to test", async () => {
    const response = await send(quentin, `/${quentinId}/test`, "POST");
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("mailbox_not_configured");
  });

  it("lets a super admin replace a member's password, journals it and mails the member", async () => {
    const response = await send(
      quentin,
      `/${anthoId}`,
      "PUT",
      change({ smtpPassword: "nouveau-mot-de-passe" }),
    );
    expect(response.status).toBe(204);
    const { settings } = await settingsOf(antho, anthoId);
    expect(settings?.updatedBy).toEqual({ id: quentinId, name: expect.any(String) });
    expect(settings?.verifiedAt).toBeNull();
    expect(platform.lastLoggedUrl()).toBe("http://localhost:5173/admin/configuration");
    const journal = await platform.env.DB.prepare(
      "SELECT actor_user_id, data FROM audit_logs WHERE action = 'mail_settings.updated' AND target_id = ? ORDER BY created_at DESC",
    )
      .bind(anthoId)
      .first<{ actor_user_id: string; data: string }>();
    expect(journal).toEqual({
      actor_user_id: quentinId,
      data: JSON.stringify({ fields: "smtpPassword" }),
    });
  });

  it("does not let a salesperson read or change another member's mailbox", async () => {
    expect((await send(antho, `/${quentinId}`, "GET")).status).toBe(403);
    expect((await send(antho, `/${quentinId}`, "PUT", change())).status).toBe(403);
    expect((await send(antho, `/${quentinId}/test`, "POST")).status).toBe(403);
  });

  it("does not find someone outside the Passalio team", async () => {
    const response = await send(quentin, "/inconnu", "GET");
    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("member_not_found");
  });
});
