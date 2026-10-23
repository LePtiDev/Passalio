import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { inviteMember } from "./invite-member";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryIdentityState;
const run = () => inviteMember(createInMemoryIdentityDependencies(state, () => NOW));
const owner = organizationActorWith("owner");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("inviteMember", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s invite a member", async (role) => {
    const result = await run()(organizationActorWith(role), {
      email: "lea@example.fr",
      role: "secretary",
    });
    expect(result.isOk).toBe(true);
  });

  it.each<OrganizationRole>(["admin", "secretary", "technician"])(
    "invites someone as %s for 7 days, emails and logs it",
    async (role) => {
      const result = await run()(owner, { email: " Lea@Example.FR ", role });
      const invitation = state.invitations[0];
      expect(result).toEqual({ isOk: true, value: invitation });
      expect(invitation).toMatchObject({
        organizationId: "organization-a",
        email: "lea@example.fr",
        role,
        status: "pending",
        inviterId: "user-owner",
        expiresAt: new Date("2026-10-30T10:00:00Z"),
      });
      expect(state.notifiedInvitations).toEqual([invitation]);
      expect(state.auditEntries).toEqual([
        {
          organizationId: "organization-a",
          actorUserId: "user-owner",
          action: "member.invited",
          targetType: "invitation",
          targetId: invitation?.id,
          data: { role },
        },
      ]);
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(
      run()(organizationActorWith(role), { email: "lea@example.fr", role: "technician" }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.invitations).toEqual([]);
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        email: "lea@example.fr",
        role: "technician",
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.notifiedInvitations).toEqual([]);
  });

  it("never invites a second owner", async () => {
    expect(await run()(owner, { email: "lea@example.fr", role: "owner" })).toEqual({
      isOk: false,
      error: "owner_role_not_assignable",
    });
    expect(state.invitations).toEqual([]);
  });

  it("refuses someone already in the team, whatever the case of the address", async () => {
    expect(await run()(owner, { email: "Technician@Example.fr", role: "admin" })).toEqual({
      isOk: false,
      error: "already_member",
    });
    expect(state.notifiedInvitations).toEqual([]);
  });

  it("invites a member of another organization", async () => {
    expect((await run()(owner, { email: "technician-b@example.fr", role: "admin" })).isOk).toBe(
      true,
    );
  });

  it("answers not found when the organization no longer exists", async () => {
    state.organizations.splice(0, 1);
    expect(await run()(owner, { email: "lea@example.fr", role: "admin" })).toEqual({
      isOk: false,
      error: "organization_not_found",
    });
    expect(state.invitations).toEqual([]);
  });
});
