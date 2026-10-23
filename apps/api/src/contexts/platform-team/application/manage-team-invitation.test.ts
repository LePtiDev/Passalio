import { ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryTeamDependencies,
  createInMemoryTeamState,
  inMemoryTeamInvitation,
  type InMemoryTeamState,
} from "../infrastructure/in-memory-team-dependencies";
import { cancelTeamInvitation, resendTeamInvitation } from "./manage-team-invitation";

const SENT_AT = new Date("2026-10-10T10:00:00Z");
const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryTeamState;
const dependencies = () =>
  createInMemoryTeamDependencies(
    state,
    () => NOW,
    () => "new-id",
  );
const superadmin = platformActorWith("superadmin", { name: "Quentin" });

const addInvitation = (id: string, status: "pending" | "accepted" | "canceled" | "rejected") =>
  state.invitations.push(
    inMemoryTeamInvitation({
      id,
      email: `${id}@passalio.com`,
      role: "admin",
      inviterId: "user-other",
      createdAt: SENT_AT,
      status,
    }),
  );

beforeEach(() => {
  state = createInMemoryTeamState();
  addInvitation("invitation-1", "pending");
});

describe("resendTeamInvitation", () => {
  it("gives 7 more days from now, emails again in the name of the sender and logs it", async () => {
    const result = await resendTeamInvitation(dependencies())(superadmin, "invitation-1");
    const expiresAt = new Date("2026-10-30T10:00:00Z");
    expect(result).toEqual({ isOk: true, value: expiresAt });
    expect(state.invitations[0]?.expiresAt).toEqual(expiresAt);
    expect(
      state.notifications.map(({ invitation, inviterName }) => [
        invitation.id,
        invitation.expiresAt,
        inviterName,
      ]),
    ).toEqual([["invitation-1", expiresAt, "Quentin"]]);
    expect(state.auditEntries).toEqual([
      {
        actorUserId: superadmin.userId,
        action: "platform.invitation_resent",
        targetType: "platform_invitation",
        targetId: "invitation-1",
        data: { role: "admin" },
      },
    ]);
  });

  it("revives an expired invitation that is still pending", async () => {
    const result = await resendTeamInvitation(dependencies())(superadmin, "invitation-1");
    expect(result.isOk).toBe(true);
    expect(state.invitations[0]?.status).toBe("pending");
  });

  it.each(["accepted", "canceled", "rejected"] as const)(
    "answers not found for an invitation already %s",
    async (status) => {
      addInvitation("invitation-closed", status);
      expect(await resendTeamInvitation(dependencies())(superadmin, "invitation-closed")).toEqual({
        isOk: false,
        error: "invitation_not_found",
      });
      expect(state.notifications).toEqual([]);
      expect(state.auditEntries).toEqual([]);
    },
  );

  it("answers not found for an unknown invitation", async () => {
    expect(await resendTeamInvitation(dependencies())(superadmin, "invitation-unknown")).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses an %s, who cannot manage the team",
    async (role) => {
      await expect(
        resendTeamInvitation(dependencies())(platformActorWith(role), "invitation-1"),
      ).rejects.toThrow(ForbiddenError);
      expect(state.notifications).toEqual([]);
    },
  );
});

describe("cancelTeamInvitation", () => {
  it("cancels a pending invitation and logs it", async () => {
    expect(await cancelTeamInvitation(dependencies())(superadmin, "invitation-1")).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.invitations[0]?.status).toBe("canceled");
    expect(state.auditEntries).toEqual([
      {
        actorUserId: superadmin.userId,
        action: "platform.invitation_canceled",
        targetType: "platform_invitation",
        targetId: "invitation-1",
        data: { role: "admin" },
      },
    ]);
  });

  it("cannot cancel the same invitation twice", async () => {
    await cancelTeamInvitation(dependencies())(superadmin, "invitation-1");
    expect(await cancelTeamInvitation(dependencies())(superadmin, "invitation-1")).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
    expect(state.auditEntries).toHaveLength(1);
  });

  it.each(["accepted", "rejected"] as const)(
    "answers not found for an invitation already %s",
    async (status) => {
      addInvitation("invitation-closed", status);
      expect(await cancelTeamInvitation(dependencies())(superadmin, "invitation-closed")).toEqual({
        isOk: false,
        error: "invitation_not_found",
      });
      expect(state.invitations[1]?.status).toBe(status);
    },
  );

  it("answers not found for an unknown invitation", async () => {
    expect(await cancelTeamInvitation(dependencies())(superadmin, "invitation-unknown")).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses an %s, who cannot manage the team",
    async (role) => {
      await expect(
        cancelTeamInvitation(dependencies())(platformActorWith(role), "invitation-1"),
      ).rejects.toThrow(ForbiddenError);
      expect(state.invitations[0]?.status).toBe("pending");
    },
  );
});
