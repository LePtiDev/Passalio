import { ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryTeamDependencies,
  createInMemoryTeamState,
  inMemoryTeamInvitation,
  inMemoryTeamUser,
  type InMemoryTeamState,
} from "../infrastructure/in-memory-team-dependencies";
import { inviteTeammate } from "./invite-teammate";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryTeamState;
let nextId: number;
const run = () =>
  inviteTeammate(
    createInMemoryTeamDependencies(
      state,
      () => NOW,
      () => `invitation-${(nextId += 1)}`,
    ),
  );
const superadmin = platformActorWith("superadmin", { name: "Quentin" });

beforeEach(() => {
  state = createInMemoryTeamState();
  nextId = 0;
  state.users.push(inMemoryTeamUser({ id: superadmin.userId, role: "superadmin" }));
});

describe("inviteTeammate", () => {
  it.each<PlatformRole>(["superadmin", "admin", "sales"])(
    "lets a superadmin invite a new %s for 7 days, emails the invitation and logs it",
    async (role) => {
      const result = await run()(superadmin, { email: " Antho@Passalio.com ", role });
      const invitation = {
        id: "invitation-1",
        email: "antho@passalio.com",
        role,
        status: "pending",
        inviterId: superadmin.userId,
        expiresAt: new Date("2026-10-30T10:00:00Z"),
        createdAt: NOW,
      };
      expect(result).toEqual({ isOk: true, value: invitation });
      expect(state.invitations).toEqual([invitation]);
      expect(state.notifications).toEqual([{ invitation, inviterName: "Quentin" }]);
      expect(state.auditEntries).toEqual([
        {
          actorUserId: superadmin.userId,
          action: "platform.invitation_sent",
          targetType: "platform_invitation",
          targetId: "invitation-1",
          data: { role },
        },
      ]);
    },
  );

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses an %s, who cannot manage the team",
    async (role) => {
      await expect(
        run()(platformActorWith(role), { email: "antho@passalio.com", role: "sales" }),
      ).rejects.toThrow(ForbiddenError);
      expect(state.invitations).toEqual([]);
      expect(state.notifications).toEqual([]);
    },
  );

  it("refuses someone who is already in the team", async () => {
    state.users.push(
      inMemoryTeamUser({ id: "user-antho", email: "antho@passalio.com", role: "sales" }),
    );
    const result = await run()(superadmin, { email: "Antho@Passalio.com", role: "admin" });
    expect(result).toEqual({ isOk: false, error: "already_in_team" });
    expect(state.invitations).toEqual([]);
    expect(state.notifications).toEqual([]);
    expect(state.auditEntries).toEqual([]);
  });

  it("invites a person who has an account without any platform role", async () => {
    state.users.push(
      inMemoryTeamUser({ id: "user-antho", email: "antho@passalio.com", role: null }),
    );
    const result = await run()(superadmin, { email: "antho@passalio.com", role: "sales" });
    expect(result.isOk).toBe(true);
  });

  it("replaces the invitation still pending for the same address", async () => {
    state.invitations.push(
      inMemoryTeamInvitation({
        id: "invitation-old",
        email: "antho@passalio.com",
        role: "admin",
        inviterId: superadmin.userId,
        createdAt: new Date("2026-10-20T10:00:00Z"),
      }),
    );
    await run()(superadmin, { email: "antho@passalio.com", role: "sales" });
    expect(state.invitations.map(({ id, status, role }) => ({ id, status, role }))).toEqual([
      { id: "invitation-old", status: "canceled", role: "admin" },
      { id: "invitation-1", status: "pending", role: "sales" },
    ]);
  });
});

describe("inviteTeammate and other pending invitations", () => {
  it("keeps the pending invitation of another address", async () => {
    state.invitations.push(
      inMemoryTeamInvitation({
        id: "invitation-lea",
        email: "lea@passalio.com",
        role: "admin",
        inviterId: superadmin.userId,
        createdAt: new Date("2026-10-20T10:00:00Z"),
      }),
    );
    await run()(superadmin, { email: "antho@passalio.com", role: "sales" });
    expect(state.invitations.find(({ id }) => id === "invitation-lea")?.status).toBe("pending");
  });

  it("replaces the pending invitation even when the new address is written with other case", async () => {
    state.invitations.push(
      inMemoryTeamInvitation({
        id: "invitation-old",
        email: "antho@passalio.com",
        role: "admin",
        inviterId: superadmin.userId,
        createdAt: new Date("2026-10-20T10:00:00Z"),
      }),
    );
    await run()(superadmin, { email: "ANTHO@passalio.com ", role: "sales" });
    expect(
      state.invitations.filter(
        ({ email, status }) => email === "antho@passalio.com" && status === "pending",
      ),
    ).toHaveLength(1);
  });

  it("refuses the address of a superadmin, already in the team", async () => {
    expect(
      await run()(superadmin, { email: `${superadmin.userId}@passalio.com`, role: "admin" }),
    ).toEqual({ isOk: false, error: "already_in_team" });
    expect(state.invitations).toEqual([]);
  });
});
