import { ORGANIZATION_ROLES, type OrganizationRole } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { isCompanyPermissionGranted } from "../../../../packages/shared/test/permission-requirements";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createOrganization, joinOrganization } from "./matrix-sessions";

const createdCustomer = z.object({ customer: z.object({ id: z.string() }) });
const organizationResponse = z.object({
  organization: z.object({ name: z.string() }).loose(),
});
const membersResponse = z.object({
  members: z.array(z.object({ id: z.string(), email: z.string(), role: z.string() }).loose()),
});
const invitationsResponse = z.object({
  invitations: z.array(z.object({ email: z.string() }).loose()),
});

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const OWNER_EMAIL = "patron-resultats@example.fr";
const ORGANIZATION_NAME = "Ramonage Resultats";
const EMAIL_OF: Readonly<Record<Exclude<OrganizationRole, "owner">, string>> = {
  admin: "admin-resultats@example.fr",
  secretary: "secretariat-resultats@example.fr",
  technician: "technicien-resultats@example.fr",
};

let platform: TestPlatform;
const cookies = new Map<OrganizationRole, string>();

const cookieOf = (role: OrganizationRole) => cookies.get(role) ?? "";

const createCustomer = async (role: OrganizationRole, lastName: string) => {
  const response = await platform.request(
    "/api/customers",
    json({
      customer: { kind: "individual", lastName },
      site: {
        address: "2 rue des Roles",
        postalCode: "75012",
        city: "Paris",
        buildingType: "house",
      },
    }),
    cookieOf(role),
  );
  expect(response.status).toBe(201);
  return createdCustomer.parse(await response.json()).customer.id;
};

const organizationName = async () =>
  organizationResponse.parse(
    await (await platform.request("/api/organization", {}, cookieOf("owner"))).json(),
  ).organization.name;

const membersOfOrganization = async () =>
  membersResponse.parse(
    await (await platform.request("/api/members", {}, cookieOf("owner"))).json(),
  ).members;

const pendingInvitationEmails = async () =>
  invitationsResponse
    .parse(await (await platform.request("/api/invitations", {}, cookieOf("owner"))).json())
    .invitations.map(({ email }) => email);

const roleCases = (permission: Parameters<typeof isCompanyPermissionGranted>[1]) =>
  ORGANIZATION_ROLES.map((role) => ({
    role,
    isGranted: isCompanyPermissionGranted(role, permission),
  }));

beforeAll(async () => {
  platform = await startTestPlatform();
  const owner = await platform.signIn(OWNER_EMAIL);
  const organizationId = await createOrganization(platform, owner, ORGANIZATION_NAME);
  cookies.set("owner", owner);
  cookies.set(
    "admin",
    await joinOrganization(platform, owner, organizationId, EMAIL_OF.admin, "admin"),
  );
  cookies.set(
    "secretary",
    await joinOrganization(platform, owner, organizationId, EMAIL_OF.secretary, "secretary"),
  );
  cookies.set(
    "technician",
    await joinOrganization(platform, owner, organizationId, EMAIL_OF.technician, "technician"),
  );
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("what each company role really does with real data", () => {
  it.each(ORGANIZATION_ROLES)("the %s creates a customer and reads it back", async (role) => {
    const customerId = await createCustomer(role, `Client du ${role}`);
    const response = await platform.request(`/api/customers/${customerId}`, {}, cookieOf(role));
    expect(response.status).toBe(200);
  });

  it.each(roleCases("customers:archive"))(
    "the $role archiving a real customer succeeds only when allowed: $isGranted",
    async ({ role, isGranted }) => {
      const customerId = await createCustomer("owner", `A archiver par ${role}`);
      const response = await platform.request(
        `/api/customers/${customerId}`,
        { method: "DELETE" },
        cookieOf(role),
      );
      expect(response.status).toBe(isGranted ? 204 : 403);
      const after = await platform.request(`/api/customers/${customerId}`, {}, cookieOf("owner"));
      expect(after.status).toBe(isGranted ? 404 : 200);
    },
  );

  it.each(ORGANIZATION_ROLES)("the %s reads the company settings", async (role) => {
    const response = await platform.request("/api/organization", {}, cookieOf(role));
    expect(response.status).toBe(200);
  });

  it.each(roleCases("organization:update"))(
    "the $role renaming the company succeeds only when allowed: $isGranted",
    async ({ role, isGranted }) => {
      const newName = `Ramonage renomme par ${role}`;
      const before = await organizationName();
      const response = await platform.request(
        "/api/organization",
        json({ name: newName }, "PATCH"),
        cookieOf(role),
      );
      expect(response.status).toBe(isGranted ? 204 : 403);
      expect(await organizationName()).toBe(isGranted ? newName : before);
    },
  );

  it.each(ORGANIZATION_ROLES)("the %s sees the team and the pending invitations", async (role) => {
    expect((await platform.request("/api/members", {}, cookieOf(role))).status).toBe(200);
    expect((await platform.request("/api/invitations", {}, cookieOf(role))).status).toBe(200);
  });

  it.each(roleCases("members:manage"))(
    "the $role inviting a technician succeeds only when allowed: $isGranted",
    async ({ role, isGranted }) => {
      const email = `invite-par-${role}@example.fr`;
      const response = await platform.request(
        "/api/invitations",
        json({ email, role: "technician" }),
        cookieOf(role),
      );
      expect(response.status).toBe(isGranted ? 201 : 403);
      expect((await pendingInvitationEmails()).includes(email)).toBe(isGranted);
    },
  );

  it.each(roleCases("members:manage"))(
    "the $role changing the technician's role succeeds only when allowed: $isGranted",
    async ({ role, isGranted }) => {
      const technician = (await membersOfOrganization()).find(
        ({ email }) => email === EMAIL_OF.technician,
      );
      const response = await platform.request(
        `/api/members/${technician?.id ?? ""}`,
        json({ role: "secretary" }, "PATCH"),
        cookieOf(role),
      );
      expect(response.status).toBe(isGranted ? 204 : 403);
      const changed = (await membersOfOrganization()).find(
        ({ email }) => email === EMAIL_OF.technician,
      );
      expect(changed?.role).toBe(isGranted ? "secretary" : "technician");
      await platform.request(
        `/api/members/${technician?.id ?? ""}`,
        json({ role: "technician" }, "PATCH"),
        cookieOf("owner"),
      );
    },
  );
});

const ownerMemberId = async () =>
  (await membersOfOrganization()).find(({ email }) => email === OWNER_EMAIL)?.id ?? "";

const expectSingleOwner = async () => {
  const owners = (await membersOfOrganization()).filter(({ role }) => role === "owner");
  expect(owners.map(({ email }) => email)).toEqual([OWNER_EMAIL]);
};

describe("nobody invites, names or removes an owner", () => {
  it.each(["owner", "admin"] as const)("the %s cannot invite an owner", async (role) => {
    const email = `second-patron-par-${role}@example.fr`;
    const response = await platform.request(
      "/api/invitations",
      json({ email, role: "owner" }),
      cookieOf(role),
    );
    expect(response.ok).toBe(false);
    expect(await pendingInvitationEmails()).not.toContain(email);
  });

  it.each(["owner", "admin"] as const)("the %s cannot name a member owner", async (role) => {
    const technician = (await membersOfOrganization()).find(
      ({ email }) => email === EMAIL_OF.technician,
    );
    const response = await platform.request(
      `/api/members/${technician?.id ?? ""}`,
      json({ role: "owner" }, "PATCH"),
      cookieOf(role),
    );
    expect(response.ok).toBe(false);
    await expectSingleOwner();
  });

  it("the admin cannot change the role of the owner", async () => {
    const response = await platform.request(
      `/api/members/${await ownerMemberId()}`,
      json({ role: "technician" }, "PATCH"),
      cookieOf("admin"),
    );
    expect(response.ok).toBe(false);
    await expectSingleOwner();
  });

  it("the admin cannot remove the owner", async () => {
    const response = await platform.request(
      `/api/members/${await ownerMemberId()}`,
      { method: "DELETE" },
      cookieOf("admin"),
    );
    expect(response.ok).toBe(false);
    await expectSingleOwner();
  });

  it.each(["admin", "secretary", "technician"] as const)(
    "the %s cannot take the ownership for itself",
    async (role) => {
      const self = (await membersOfOrganization()).find(({ email }) => email === EMAIL_OF[role]);
      const response = await platform.request(
        "/api/ownership-transfer",
        json({ memberId: self?.id ?? "" }),
        cookieOf(role),
      );
      expect(response.status).toBe(403);
      await expectSingleOwner();
    },
  );
});
