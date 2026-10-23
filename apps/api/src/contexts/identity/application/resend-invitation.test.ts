import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import {
  inMemoryInvitation,
  seedOrganizationOf,
} from "../infrastructure/in-memory-identity-fixtures";
import { resendInvitation } from "./resend-invitation";

const NOW = new Date("2026-10-23T10:00:00Z");
const NEXT_WEEK = new Date("2026-10-30T10:00:00Z");

let state: InMemoryIdentityState;
const run = () => resendInvitation(createInMemoryIdentityDependencies(state, () => NOW));
const admin = organizationActorWith("admin");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
  state.invitations.push(
    inMemoryInvitation({
      id: "invitation-expired",
      organizationId: "organization-a",
      expiresAt: new Date("2026-10-01T10:00:00Z"),
    }),
    inMemoryInvitation({
      id: "invitation-canceled",
      organizationId: "organization-a",
      status: "canceled",
    }),
    inMemoryInvitation({ id: "invitation-b", organizationId: "organization-b" }),
  );
});

describe("resendInvitation", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s resend an invitation", async (role) => {
    expect(
      await run()(organizationActorWith(role), { invitationId: "invitation-expired" }),
    ).toEqual({ isOk: true, value: NEXT_WEEK });
  });

  it("gives an expired invitation 7 more days, emails it again and logs it", async () => {
    await run()(admin, { invitationId: "invitation-expired" });
    expect(state.invitations[0]?.expiresAt).toEqual(NEXT_WEEK);
    expect(state.notifiedInvitations.map(({ id, expiresAt }) => ({ id, expiresAt }))).toEqual([
      { id: "invitation-expired", expiresAt: NEXT_WEEK },
    ]);
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "invitation.resent",
        targetType: "invitation",
        targetId: "invitation-expired",
      },
    ]);
  });

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(
      run()(organizationActorWith(role), { invitationId: "invitation-expired" }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.notifiedInvitations).toEqual([]);
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        invitationId: "invitation-expired",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("answers not found for a canceled invitation", async () => {
    expect(await run()(admin, { invitationId: "invitation-canceled" })).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
    expect(state.notifiedInvitations).toEqual([]);
  });

  it("does not resend an invitation of another organization", async () => {
    expect(await run()(admin, { invitationId: "invitation-b" })).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it("answers not found when the organization no longer exists", async () => {
    state.organizations.splice(0, 1);
    expect(await run()(admin, { invitationId: "invitation-expired" })).toEqual({
      isOk: false,
      error: "organization_not_found",
    });
    expect(state.notifiedInvitations).toEqual([]);
  });
});

describe("resendInvitation of a closed invitation", () => {
  it.each(["accepted", "rejected"] as const)(
    "answers not found for an %s invitation and sends nothing",
    async (status) => {
      const expiresAt = new Date("2026-10-01T10:00:00Z");
      state.invitations.push(
        inMemoryInvitation({
          id: "invitation-closed",
          organizationId: "organization-a",
          status,
          expiresAt,
        }),
      );
      expect(await run()(admin, { invitationId: "invitation-closed" })).toEqual({
        isOk: false,
        error: "invitation_not_found",
      });
      expect(state.invitations.find(({ id }) => id === "invitation-closed")).toMatchObject({
        status,
        expiresAt,
      });
      expect(state.notifiedInvitations).toEqual([]);
      expect(state.auditEntries).toEqual([]);
    },
  );

  it("leaves an invitation of another organization as it was", async () => {
    await run()(admin, { invitationId: "invitation-b" });
    expect(state.invitations.find(({ id }) => id === "invitation-b")?.expiresAt).toEqual(
      new Date("2026-10-30T10:00:00Z"),
    );
    expect(state.notifiedInvitations).toEqual([]);
    expect(state.auditEntries).toEqual([]);
  });

  it("gives 7 days from now, not from the old expiry, to an invitation still valid", async () => {
    state.invitations.push(
      inMemoryInvitation({
        id: "invitation-valid",
        organizationId: "organization-a",
        expiresAt: new Date("2026-10-25T10:00:00Z"),
      }),
    );
    expect(await run()(admin, { invitationId: "invitation-valid" })).toEqual({
      isOk: true,
      value: NEXT_WEEK,
    });
    expect(NEXT_WEEK.getTime() - NOW.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
