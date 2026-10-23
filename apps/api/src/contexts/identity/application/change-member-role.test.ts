import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { memberIdOf, seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { changeMemberRole } from "./change-member-role";

let state: InMemoryIdentityState;
const run = () => changeMemberRole(createInMemoryIdentityDependencies(state));
const admin = organizationActorWith("admin");
const roleOf = (memberId: string) => state.members.find(({ id }) => id === memberId)?.role;
const technicianId = memberIdOf("technician", "organization-a");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("changeMemberRole", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s change a role", async (role) => {
    expect(
      await run()(organizationActorWith(role), { memberId: technicianId, role: "secretary" }),
    ).toEqual({ isOk: true, value: undefined });
    expect(roleOf(technicianId)).toBe("secretary");
  });

  it("logs the old and new role", async () => {
    await run()(admin, { memberId: technicianId, role: "admin" });
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "member.role_changed",
        targetType: "member",
        targetId: technicianId,
        data: { from: "technician", to: "admin" },
      },
    ]);
  });

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(
      run()(organizationActorWith(role), { memberId: technicianId, role: "admin" }),
    ).rejects.toThrow(ForbiddenError);
    expect(roleOf(technicianId)).toBe("technician");
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        memberId: technicianId,
        role: "admin",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("never names a second owner", async () => {
    expect(await run()(admin, { memberId: technicianId, role: "owner" })).toEqual({
      isOk: false,
      error: "owner_role_not_assignable",
    });
    expect(roleOf(technicianId)).toBe("technician");
  });

  it("never changes the role of the owner", async () => {
    const ownerId = memberIdOf("owner", "organization-a");
    expect(await run()(admin, { memberId: ownerId, role: "admin" })).toEqual({
      isOk: false,
      error: "owner_cannot_be_changed",
    });
    expect(roleOf(ownerId)).toBe("owner");
  });

  it("does not reach a member of another organization", async () => {
    const otherId = memberIdOf("technician", "organization-b");
    expect(await run()(admin, { memberId: otherId, role: "admin" })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
    expect(roleOf(otherId)).toBe("technician");
  });
});
