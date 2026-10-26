import type { OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { memberIdOf, seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { changeMemberRole } from "./change-member-role";
import { inviteMember } from "./invite-member";

const NOW = new Date("2026-10-23T10:00:00Z");
const owner = organizationActorWith("owner");
const secretaryId = memberIdOf("secretary", "organization-a");
const technicianId = memberIdOf("technician", "organization-a");

let state: InMemoryIdentityState;
const dependencies = () => createInMemoryIdentityDependencies(state, () => NOW);
const roleOf = (memberId: string) => state.members.find(({ id }) => id === memberId)?.role;

const withFullSeats = (organizationIds: readonly string[]) => {
  const fresh = createInMemoryIdentityState();
  state = { ...fresh, fullTechnicianSeats: new Set(organizationIds) };
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
};

beforeEach(() => {
  withFullSeats(["organization-a"]);
});

describe("Solo technician seat when inviting", () => {
  it.each<OrganizationRole>(["technician", "admin"])(
    "refuses to invite a %s once the only Solo seat is taken",
    async (role) => {
      const result = await inviteMember(dependencies())(owner, { email: "paul@example.fr", role });
      expect(result).toEqual({ isOk: false, error: "team_plan_required" });
      expect(state.invitations).toEqual([]);
      expect(state.notifiedInvitations).toEqual([]);
      expect(state.auditEntries).toEqual([]);
    },
  );

  it("still invites a secretary, included in Solo", async () => {
    const result = await inviteMember(dependencies())(owner, {
      email: "lea@example.fr",
      role: "secretary",
    });
    expect(result.isOk).toBe(true);
    expect(state.invitations).toHaveLength(1);
  });

  it("invites a technician when the company still has a free seat", async () => {
    withFullSeats(["organization-b"]);
    const result = await inviteMember(dependencies())(owner, {
      email: "paul@example.fr",
      role: "technician",
    });
    expect(result.isOk).toBe(true);
  });
});

describe("Solo technician seat when changing a role", () => {
  it.each<OrganizationRole>(["technician", "admin"])(
    "refuses to make a secretary %s once the only Solo seat is taken",
    async (role) => {
      const result = await changeMemberRole(dependencies())(owner, {
        memberId: secretaryId,
        role,
      });
      expect(result).toEqual({ isOk: false, error: "team_plan_required" });
      expect(roleOf(secretaryId)).toBe("secretary");
      expect(state.auditEntries).toEqual([]);
    },
  );

  it("lets a technician become admin, which keeps the same seat", async () => {
    const result = await changeMemberRole(dependencies())(owner, {
      memberId: technicianId,
      role: "admin",
    });
    expect(result).toEqual({ isOk: true, value: undefined });
    expect(roleOf(technicianId)).toBe("admin");
  });

  it("lets a technician become secretary, which frees the seat", async () => {
    const result = await changeMemberRole(dependencies())(owner, {
      memberId: technicianId,
      role: "secretary",
    });
    expect(result).toEqual({ isOk: true, value: undefined });
  });
});
