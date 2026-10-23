import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { createOrganization } from "./create-organization";

let state: InMemoryIdentityState;
const run = () => createOrganization(createInMemoryIdentityDependencies(state));
const jean = { userId: "user-jean", email: "jean@example.fr", isImpersonating: false };

beforeEach(() => {
  state = createInMemoryIdentityState();
});

describe("createOrganization", () => {
  it("makes the creator the only owner, keeps the company details and logs it", async () => {
    const result = await run()(jean, {
      name: "  Ramonage   Dupont ",
      siret: "123 456 789 00011",
      address: " 1 rue du Four ",
      phone: "  ",
      teamSize: "2_to_5",
    });
    const organization = state.organizations[0];
    expect(result).toEqual({
      isOk: true,
      value: { id: organization?.id, name: "Ramonage Dupont", slug: organization?.slug },
    });
    expect(organization).toMatchObject({
      name: "Ramonage Dupont",
      siret: "12345678900011",
      address: "1 rue du Four",
      phone: null,
      teamSize: "2_to_5",
    });
    expect(state.members).toEqual([
      {
        id: expect.any(String),
        organizationId: organization?.id,
        userId: "user-jean",
        role: "owner",
      },
    ]);
    expect(state.auditEntries).toEqual([
      {
        organizationId: organization?.id,
        actorUserId: "user-jean",
        action: "organization.created",
        targetType: "organization",
        targetId: organization?.id,
      },
    ]);
  });

  it("gives two organizations with the same name different slugs", async () => {
    const first = await run()(jean, { name: "Ramonage Dupont" });
    const second = await run()(jean, { name: "Ramonage Dupont" });
    expect(first.isOk && second.isOk && first.value.slug !== second.value.slug).toBe(true);
  });

  it("lets a member of an organization create another one", async () => {
    seedOrganizationOf(state, "organization-a");
    const result = await run()(
      { userId: "user-technician", email: "technician@example.fr", isImpersonating: false },
      { name: "Ramonage Bis" },
    );
    expect(result.isOk).toBe(true);
    expect(
      state.members.filter(({ userId }) => userId === "user-technician").map(({ role }) => role),
    ).toEqual(["technician", "owner"]);
  });

  it("refuses a name that is too short", async () => {
    expect(await run()(jean, { name: " A " })).toEqual({
      isOk: false,
      error: "invalid_organization_name",
    });
    expect(state.organizations).toEqual([]);
  });

  it("refuses an invalid SIRET", async () => {
    expect(await run()(jean, { name: "Ramonage Dupont", siret: "1234" })).toEqual({
      isOk: false,
      error: "invalid_siret",
    });
    expect(state.organizations).toEqual([]);
  });

  it("refuses during an impersonation", async () => {
    expect(await run()({ ...jean, isImpersonating: true }, { name: "Ramonage Dupont" })).toEqual({
      isOk: false,
      error: "impersonation_read_only",
    });
    expect(state.organizations).toEqual([]);
  });
});
