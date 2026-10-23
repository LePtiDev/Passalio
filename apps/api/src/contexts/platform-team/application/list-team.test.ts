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
import { listTeam } from "./list-team";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryTeamState;
const run = () =>
  listTeam(
    createInMemoryTeamDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );

beforeEach(() => {
  state = createInMemoryTeamState();
});

describe("listTeam", () => {
  it("shows the superadmin every teammate and every pending invitation", async () => {
    state.users.push(
      inMemoryTeamUser({
        id: "user-quentin",
        name: "Quentin",
        role: "superadmin",
        isTwoFactorEnabled: true,
        lastSignInAt: new Date("2026-10-22T08:00:00Z"),
      }),
      inMemoryTeamUser({ id: "user-antho", name: "Antho", role: "sales" }),
      inMemoryTeamUser({ id: "user-client", name: "Client", role: null }),
    );
    state.invitations.push(
      inMemoryTeamInvitation({
        id: "invitation-pending",
        email: "lea@passalio.com",
        role: "admin",
        inviterId: "user-quentin",
        createdAt: new Date("2026-10-21T10:00:00Z"),
      }),
      inMemoryTeamInvitation({
        id: "invitation-canceled",
        email: "paul@passalio.com",
        role: "admin",
        inviterId: "user-quentin",
        createdAt: new Date("2026-10-21T10:00:00Z"),
        status: "canceled",
      }),
    );
    expect(await run()(platformActorWith("superadmin"))).toEqual({
      members: [
        {
          id: "user-antho",
          name: "Antho",
          email: "user-antho@passalio.com",
          role: "sales",
          isTwoFactorEnabled: false,
          lastSignInAt: null,
        },
        {
          id: "user-quentin",
          name: "Quentin",
          email: "user-quentin@passalio.com",
          role: "superadmin",
          isTwoFactorEnabled: true,
          lastSignInAt: new Date("2026-10-22T08:00:00Z"),
        },
      ],
      invitations: [
        {
          id: "invitation-pending",
          email: "lea@passalio.com",
          role: "admin",
          inviterName: "Quentin",
          sentAt: new Date("2026-10-21T10:00:00Z"),
          expiresAt: new Date("2026-10-28T10:00:00Z"),
        },
      ],
    });
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses an %s, who cannot manage the team",
    async (role) => {
      await expect(run()(platformActorWith(role))).rejects.toThrow(ForbiddenError);
    },
  );
});
