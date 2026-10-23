import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { memberIdOf, seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { transferOwnership } from "./transfer-ownership";

let state: InMemoryIdentityState;
const run = () => transferOwnership(createInMemoryIdentityDependencies(state));
const owner = organizationActorWith("owner");
const roleOf = (memberId: string) => state.members.find(({ id }) => id === memberId)?.role;
const ownerId = memberIdOf("owner", "organization-a");
const adminId = memberIdOf("admin", "organization-a");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("transferOwnership", () => {
  it("makes the admin the owner and the former owner an admin, then logs it", async () => {
    expect(await run()(owner, { memberId: adminId })).toEqual({ isOk: true, value: undefined });
    expect(roleOf(adminId)).toBe("owner");
    expect(roleOf(ownerId)).toBe("admin");
    expect(
      state.members.filter(
        ({ organizationId, role }) => organizationId === "organization-a" && role === "owner",
      ),
    ).toHaveLength(1);
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-owner",
        action: "ownership.transferred",
        targetType: "member",
        targetId: adminId,
        data: { previousOwnerMemberId: ownerId },
      },
    ]);
  });

  it.each<OrganizationRole>(["admin", "secretary", "technician"])("refuses a %s", async (role) => {
    await expect(run()(organizationActorWith(role), { memberId: adminId })).rejects.toThrow(
      ForbiddenError,
    );
    expect(roleOf(ownerId)).toBe("owner");
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), { memberId: adminId }),
    ).rejects.toThrow(ForbiddenError);
  });

  it.each<OrganizationRole>(["secretary", "technician"])(
    "only gives the ownership to an admin, not to a %s",
    async (role) => {
      expect(await run()(owner, { memberId: memberIdOf(role, "organization-a") })).toEqual({
        isOk: false,
        error: "transfer_target_not_admin",
      });
      expect(roleOf(ownerId)).toBe("owner");
    },
  );

  it("does not transfer the ownership to oneself", async () => {
    expect(await run()(owner, { memberId: ownerId })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
  });

  it("does not reach an admin of another organization", async () => {
    expect(await run()(owner, { memberId: memberIdOf("admin", "organization-b") })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
    expect(roleOf(memberIdOf("admin", "organization-b"))).toBe("admin");
  });
});

describe("transferOwnership without a current membership", () => {
  it("answers not found when the owner is no longer a member, and changes no role", async () => {
    state.members.splice(
      state.members.findIndex(({ id }) => id === ownerId),
      1,
    );
    expect(await run()(owner, { memberId: adminId })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
    expect(roleOf(adminId)).toBe("admin");
    expect(state.auditEntries).toEqual([]);
  });

  it("answers not found for an unknown member and logs nothing", async () => {
    expect(await run()(owner, { memberId: "member-unknown" })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
    expect(roleOf(ownerId)).toBe("owner");
    expect(state.auditEntries).toEqual([]);
  });
});
