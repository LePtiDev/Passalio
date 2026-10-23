import { expect } from "vitest";
import * as z from "zod";
import type { TestPlatform } from "./test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });
const meResponse = z.object({ actor: z.object({ userId: z.string() }) });

export const jsonBody = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const createChimneySweepingOrganization = async (
  platform: TestPlatform,
  cookie: string,
  name: string,
) => {
  const response = await platform.request("/api/organizations", jsonBody({ name }), cookie);
  expect(response.status).toBe(201);
  const { organization } = organizationResponse.parse(await response.json());
  expect((await platform.setActiveOrganization(cookie, organization.id)).status).toBe(200);
  const trades = await platform.request(
    "/api/organization",
    jsonBody({ trades: ["chimney_sweeping"] }, "PATCH"),
    cookie,
  );
  expect(trades.ok).toBe(true);
  return organization.id;
};

export const joinOrganization = async (
  platform: TestPlatform,
  {
    ownerCookie,
    organizationId,
    email,
    role,
  }: {
    readonly ownerCookie: string;
    readonly organizationId: string;
    readonly email: string;
    readonly role: "admin" | "secretary" | "technician";
  },
) => {
  const invited = await platform.request(
    "/api/invitations",
    jsonBody({ email, role }),
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
  expect((await platform.setActiveOrganization(cookie, organizationId)).status).toBe(200);
  return cookie;
};

export const userIdOf = async (platform: TestPlatform, cookie: string) => {
  const response = await platform.request("/api/me", {}, cookie);
  expect(response.status).toBe(200);
  return meResponse.parse(await response.json()).actor.userId;
};

export const impersonate = async (platform: TestPlatform, cookie: string, supportEmail: string) => {
  await platform.signIn(supportEmail);
  const token = decodeURIComponent(cookie.split("=")[1] ?? "").split(".")[0];
  await platform.env.DB.prepare(
    "UPDATE sessions SET impersonated_by = (SELECT id FROM users WHERE email = ?), impersonation_reason = 'Demande de support' WHERE token = ?",
  )
    .bind(supportEmail, token)
    .run();
};
