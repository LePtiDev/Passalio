import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryTeamDependencies,
  createInMemoryTeamState,
  inMemoryTeamInvitation,
  inMemoryTeamUser,
  type InMemoryTeamState,
} from "../infrastructure/in-memory-team-dependencies";
import { acceptTeamInvitation, getTeamInvitation } from "./join-team";

const SENT_AT = new Date("2026-10-20T10:00:00Z");
const EXPIRES_AT = new Date("2026-10-27T10:00:00Z");
const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryTeamState;
let now: Date;
const dependencies = () =>
  createInMemoryTeamDependencies(
    state,
    () => now,
    () => "new-id",
  );
const antho = { userId: "user-antho", email: "antho@passalio.com" };

beforeEach(() => {
  state = createInMemoryTeamState();
  now = NOW;
  state.users.push(
    inMemoryTeamUser({ id: "user-quentin", name: "Quentin", role: "superadmin" }),
    inMemoryTeamUser({ id: antho.userId, email: antho.email, role: null }),
  );
  state.invitations.push(
    inMemoryTeamInvitation({
      id: "invitation-1",
      email: antho.email,
      role: "sales",
      inviterId: "user-quentin",
      createdAt: SENT_AT,
      expiresAt: EXPIRES_AT,
    }),
  );
});

describe("getTeamInvitation", () => {
  it("shows the role, the address and who invited", async () => {
    expect(await getTeamInvitation(dependencies())("invitation-1")).toEqual({
      isOk: true,
      value: { role: "sales", email: antho.email, inviterName: "Quentin" },
    });
  });

  it("shows no inviter name once the inviter account is gone", async () => {
    state.users.splice(0, 1);
    const result = await getTeamInvitation(dependencies())("invitation-1");
    expect(result.isOk && result.value.inviterName).toBeNull();
  });

  it("answers not found for an unknown invitation", async () => {
    expect(await getTeamInvitation(dependencies())("invitation-unknown")).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it.each(["accepted", "canceled", "rejected"] as const)(
    "answers not found for an invitation already %s",
    async (status) => {
      state.invitations.push(
        inMemoryTeamInvitation({
          id: "invitation-closed",
          email: antho.email,
          role: "admin",
          inviterId: "user-quentin",
          createdAt: SENT_AT,
          status,
        }),
      );
      expect(await getTeamInvitation(dependencies())("invitation-closed")).toEqual({
        isOk: false,
        error: "invitation_not_found",
      });
    },
  );

  it("tells the invitation has expired at its expiry time", async () => {
    now = EXPIRES_AT;
    expect(await getTeamInvitation(dependencies())("invitation-1")).toEqual({
      isOk: false,
      error: "invitation_expired",
    });
  });
});

describe("acceptTeamInvitation", () => {
  it("gives the invited role, closes the invitation and logs it", async () => {
    const result = await acceptTeamInvitation(dependencies())(antho, "invitation-1");
    expect(result).toEqual({ isOk: true, value: "sales" });
    expect(state.users.find(({ id }) => id === antho.userId)?.role).toBe("sales");
    expect(state.invitations[0]?.status).toBe("accepted");
    expect(state.auditEntries).toEqual([
      {
        actorUserId: antho.userId,
        action: "platform.invitation_accepted",
        targetType: "user",
        targetId: antho.userId,
        data: { role: "sales", invitationId: "invitation-1" },
      },
    ]);
  });

  it("accepts the same address written with other case and spaces", async () => {
    const result = await acceptTeamInvitation(dependencies())(
      { userId: antho.userId, email: " Antho@Passalio.COM " },
      "invitation-1",
    );
    expect(result).toEqual({ isOk: true, value: "sales" });
  });

  it("refuses a person signed in with another address", async () => {
    const result = await acceptTeamInvitation(dependencies())(
      { userId: "user-intruder", email: "intruder@example.fr" },
      "invitation-1",
    );
    expect(result).toEqual({ isOk: false, error: "invitation_email_mismatch" });
    expect(state.invitations[0]?.status).toBe("pending");
    expect(state.auditEntries).toEqual([]);
  });

  it("refuses an expired invitation", async () => {
    now = new Date(EXPIRES_AT.getTime() + 1);
    expect(await acceptTeamInvitation(dependencies())(antho, "invitation-1")).toEqual({
      isOk: false,
      error: "invitation_expired",
    });
    expect(state.users.find(({ id }) => id === antho.userId)?.role).toBeNull();
  });

  it("refuses an unknown invitation", async () => {
    expect(await acceptTeamInvitation(dependencies())(antho, "invitation-unknown")).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it("cannot be accepted twice", async () => {
    await acceptTeamInvitation(dependencies())(antho, "invitation-1");
    expect(await acceptTeamInvitation(dependencies())(antho, "invitation-1")).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it("refuses a person who already has a platform role", async () => {
    state.users.push(
      inMemoryTeamUser({ id: "user-admin", email: "admin@passalio.com", role: "admin" }),
    );
    state.invitations.push(
      inMemoryTeamInvitation({
        id: "invitation-admin",
        email: "admin@passalio.com",
        role: "superadmin",
        inviterId: "user-quentin",
        createdAt: SENT_AT,
      }),
    );
    const result = await acceptTeamInvitation(dependencies())(
      { userId: "user-admin", email: "admin@passalio.com" },
      "invitation-admin",
    );
    expect(result).toEqual({ isOk: false, error: "already_in_team" });
    expect(state.users.find(({ id }) => id === "user-admin")?.role).toBe("admin");
  });
});
