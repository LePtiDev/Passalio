import { auditLogs, sessions, users } from "@passalio/db";
import { eq } from "drizzle-orm";
import { expect } from "vitest";
import { createDatabase } from "../../src/platform/database";
import type { TestPlatform } from "../test-platform";
import { jsonRequest } from "./security-fixtures";

export const sessionTokenOf = (cookie: string) =>
  decodeURIComponent(cookie.split("=")[1] ?? "").split(".")[0] ?? "";

export const joinOrganization = async (
  platform: TestPlatform,
  ownerCookie: string,
  organizationId: string,
  email: string,
  role: "admin" | "secretary" | "technician",
) => {
  const invited = await platform.request(
    "/api/invitations",
    jsonRequest({ email, role }),
    ownerCookie,
  );
  expect(invited.status).toBe(201);
  const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
  const cookie = await platform.signIn(email);
  const accepted = await platform.request(
    `/api${invitationPath}/accept`,
    { method: "POST" },
    cookie,
  );
  expect(accepted.status).toBe(201);
  await platform.setActiveOrganization(cookie, organizationId);
  return cookie;
};

export const impersonateSession = async (
  platform: TestPlatform,
  cookie: string,
  supportEmail: string,
) => {
  await platform.signIn(supportEmail);
  const database = createDatabase(platform.env.DB);
  const [support] = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, supportEmail));
  await database
    .update(sessions)
    .set({ impersonatedBy: support?.id ?? "", impersonationReason: "Demande de support" })
    .where(eq(sessions.token, sessionTokenOf(cookie)));
};

export const auditActionsOn = async (platform: TestPlatform, targetId: string) =>
  createDatabase(platform.env.DB)
    .select({ action: auditLogs.action, organizationId: auditLogs.organizationId })
    .from(auditLogs)
    .where(eq(auditLogs.targetId, targetId));
