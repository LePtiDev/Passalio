import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { auditActionsOn, impersonateSession, joinOrganization } from "./organization-members";
import { createActiveOrganization, jsonRequest } from "./security-fixtures";

let platform: TestPlatform;
let owner: string;
let admin: string;
let secretary: string;
let technician: string;
let impersonatedOwner: string;
let organizationId: string;

const invite = async (email: string) => {
  const response = await platform.request(
    "/api/invitations",
    jsonRequest({ email, role: "technician" }),
    owner,
  );
  expect(response.status).toBe(201);
  return new URL(platform.lastLoggedUrl()).pathname.split("/").at(-1) ?? "";
};

const resend = (invitationId: string, cookie: string) =>
  platform.request(`/api/invitations/${invitationId}/resend`, { method: "POST" }, cookie);

const cancel = (invitationId: string, cookie: string) =>
  platform.request(`/api/invitations/${invitationId}`, { method: "DELETE" }, cookie);

const list = (cookie: string) => platform.request("/api/invitations", {}, cookie);

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-droits-invitations@example.fr");
  organizationId = await createActiveOrganization(platform, owner, "Ramonage Droits");
  admin = await joinOrganization(
    platform,
    owner,
    organizationId,
    "admin-invitations@example.fr",
    "admin",
  );
  secretary = await joinOrganization(
    platform,
    owner,
    organizationId,
    "secretariat-invitations@example.fr",
    "secretary",
  );
  technician = await joinOrganization(
    platform,
    owner,
    organizationId,
    "technicien-invitations@example.fr",
    "technician",
  );
  impersonatedOwner = await platform.signIn("patron-droits-invitations@example.fr");
  await platform.setActiveOrganization(impersonatedOwner, organizationId);
  await impersonateSession(platform, impersonatedOwner, "support-invitations@passalio.com");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("pending invitations by role", () => {
  it.each([
    ["admin", () => admin],
    ["secretary", () => secretary],
    ["technician", () => technician],
  ])("lets the %s read the pending invitations", async (_role, cookieOf) => {
    expect((await list(cookieOf())).status).toBe(200);
  });

  it.each([
    ["secretary", () => secretary],
    ["technician", () => technician],
  ])("refuses to let the %s resend or cancel an invitation", async (_role, cookieOf) => {
    const invitationId = await invite(`refus-${crypto.randomUUID()}@example.fr`);
    expect((await resend(invitationId, cookieOf())).status).toBe(403);
    expect((await cancel(invitationId, cookieOf())).status).toBe(403);
    expect((await resend(invitationId, owner)).status).toBe(200);
  });

  it("lets the admin resend and cancel an invitation", async () => {
    const invitationId = await invite("par-admin@example.fr");
    expect((await resend(invitationId, admin)).status).toBe(200);
    expect((await cancel(invitationId, admin)).status).toBe(204);
  });
});

describe("pending invitations during an impersonation", () => {
  it("can still be listed", async () => {
    expect((await list(impersonatedOwner)).status).toBe(200);
  });

  it("cannot be resent or canceled", async () => {
    const invitationId = await invite("pendant-impersonation@example.fr");
    expect((await resend(invitationId, impersonatedOwner)).status).toBe(403);
    expect((await cancel(invitationId, impersonatedOwner)).status).toBe(403);
    expect((await resend(invitationId, owner)).status).toBe(200);
  });
});

describe("pending invitations in the audit log", () => {
  it("writes each resend and each cancellation in audit_logs", async () => {
    const invitationId = await invite("journal-invitation@example.fr");
    await resend(invitationId, owner);
    await resend(invitationId, admin);
    await cancel(invitationId, owner);
    const actions = (await auditActionsOn(platform, invitationId)).filter(
      ({ action }) => action !== "member.invited",
    );
    expect(actions).toEqual([
      { action: "invitation.resent", organizationId },
      { action: "invitation.resent", organizationId },
      { action: "invitation.canceled", organizationId },
    ]);
  });

  it("writes nothing when a resend or a cancellation is refused", async () => {
    const invitationId = await invite("journal-refus@example.fr");
    await resend(invitationId, technician);
    await cancel(invitationId, secretary);
    await resend(invitationId, impersonatedOwner);
    const actions = (await auditActionsOn(platform, invitationId)).filter(
      ({ action }) => action !== "member.invited",
    );
    expect(actions).toEqual([]);
  });
});
