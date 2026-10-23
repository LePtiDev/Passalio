import type { OrganizationRole } from "@passalio/shared";
import * as z from "zod";
import type { TestPlatform } from "../test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const ensureStatus = (response: Response, expected: number, step: string) => {
  if (response.status !== expected) {
    throw new Error(`${step}: expected ${expected}, received ${response.status}`);
  }
};

export const sessionTokenOf = (cookie: string): string =>
  decodeURIComponent(cookie.split("=")[1] ?? "").split(".")[0] ?? "";

export const createOrganization = async (
  platform: TestPlatform,
  cookie: string,
  name: string,
): Promise<string> => {
  const created = await platform.request("/api/organizations", json({ name }), cookie);
  ensureStatus(created, 201, "create organization");
  const { organization } = organizationResponse.parse(await created.json());
  ensureStatus(
    await platform.setActiveOrganization(cookie, organization.id),
    200,
    "activate organization",
  );
  ensureStatus(
    await platform.request(
      "/api/organization",
      json({ trades: ["chimney_sweeping", "boiler_maintenance"] }, "PATCH"),
      cookie,
    ),
    204,
    "choose trades",
  );
  return organization.id;
};

export const joinOrganization = async (
  platform: TestPlatform,
  ownerCookie: string,
  organizationId: string,
  email: string,
  role: Exclude<OrganizationRole, "owner">,
): Promise<string> => {
  ensureStatus(
    await platform.request("/api/invitations", json({ email, role }), ownerCookie),
    201,
    `invite ${role}`,
  );
  const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
  const cookie = await platform.signIn(email);
  ensureStatus(
    await platform.request(`/api${invitationPath}/accept`, { method: "POST" }, cookie),
    201,
    `accept ${role} invitation`,
  );
  ensureStatus(
    await platform.setActiveOrganization(cookie, organizationId),
    200,
    `activate organization for ${role}`,
  );
  return cookie;
};

export const openSecondSession = async (
  platform: TestPlatform,
  email: string,
  organizationId: string,
): Promise<string> => {
  const cookie = await platform.signIn(email);
  ensureStatus(
    await platform.setActiveOrganization(cookie, organizationId),
    200,
    "activate organization on the second session",
  );
  return cookie;
};

export const impersonateSession = async (
  platform: TestPlatform,
  cookie: string,
  impersonatorEmail: string,
) => {
  await platform.env.DB.prepare(
    "UPDATE sessions SET impersonated_by = (SELECT id FROM users WHERE email = ?), impersonation_reason = 'Matrice des routes' WHERE token = ?",
  )
    .bind(impersonatorEmail, sessionTokenOf(cookie))
    .run();
};

export const setTwoFactorProofAge = async (
  platform: TestPlatform,
  cookie: string,
  ageMs: number,
) => {
  await platform.env.DB.prepare("UPDATE sessions SET two_factor_verified_at = ? WHERE token = ?")
    .bind(Date.now() - ageMs, sessionTokenOf(cookie))
    .run();
};
