import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { memberIdOf, seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { removeMember } from "./remove-member";

let state: InMemoryIdentityState;
const run = () => removeMember(createInMemoryIdentityDependencies(state));
const admin = organizationActorWith("admin");
const hasMember = (memberId: string) => state.members.some(({ id }) => id === memberId);
const technicianId = memberIdOf("technician", "organization-a");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("removeMember", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s remove a member", async (role) => {
    expect(await run()(organizationActorWith(role), { memberId: technicianId })).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(hasMember(technicianId)).toBe(false);
  });

  it("logs the removal with the role the member had", async () => {
    await run()(admin, { memberId: technicianId });
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "member.removed",
        targetType: "member",
        targetId: technicianId,
        data: { role: "technician" },
      },
    ]);
  });

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(run()(organizationActorWith(role), { memberId: technicianId })).rejects.toThrow(
      ForbiddenError,
    );
    expect(hasMember(technicianId)).toBe(true);
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), { memberId: technicianId }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("never removes the owner", async () => {
    const ownerId = memberIdOf("owner", "organization-a");
    expect(await run()(admin, { memberId: ownerId })).toEqual({
      isOk: false,
      error: "owner_cannot_be_changed",
    });
    expect(hasMember(ownerId)).toBe(true);
  });

  it("does not reach a member of another organization", async () => {
    const otherId = memberIdOf("technician", "organization-b");
    expect(await run()(admin, { memberId: otherId })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
    expect(hasMember(otherId)).toBe(true);
  });

  it("answers not found for a member already removed", async () => {
    await run()(admin, { memberId: technicianId });
    expect(await run()(admin, { memberId: technicianId })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
  });
});
