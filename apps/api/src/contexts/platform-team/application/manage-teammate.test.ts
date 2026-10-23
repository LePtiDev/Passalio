import { ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryTeamDependencies,
  createInMemoryTeamState,
  inMemoryTeamUser,
  type InMemoryTeamState,
} from "../infrastructure/in-memory-team-dependencies";
import { changeTeammateRole, removeTeammate } from "./manage-teammate";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryTeamState;
const dependencies = () =>
  createInMemoryTeamDependencies(
    state,
    () => NOW,
    () => "new-id",
  );
const superadmin = platformActorWith("superadmin");
const roleOf = (userId: string) => state.users.find(({ id }) => id === userId)?.role;

beforeEach(() => {
  state = createInMemoryTeamState();
  state.users.push(
    inMemoryTeamUser({ id: superadmin.userId, role: "superadmin" }),
    inMemoryTeamUser({ id: "user-antho", role: "sales" }),
    inMemoryTeamUser({ id: "user-client", role: null }),
  );
});

describe("changeTeammateRole", () => {
  it("changes the role of a teammate and logs the old and new role", async () => {
    const result = await changeTeammateRole(dependencies())(superadmin, {
      userId: "user-antho",
      role: "admin",
    });
    expect(result).toEqual({ isOk: true, value: "admin" });
    expect(roleOf("user-antho")).toBe("admin");
    expect(state.auditEntries).toEqual([
      {
        actorUserId: superadmin.userId,
        action: "platform.role_changed",
        targetType: "user",
        targetId: "user-antho",
        data: { from: "sales", to: "admin" },
      },
    ]);
  });

  it("lets a superadmin name another superadmin", async () => {
    const result = await changeTeammateRole(dependencies())(superadmin, {
      userId: "user-antho",
      role: "superadmin",
    });
    expect(result).toEqual({ isOk: true, value: "superadmin" });
  });

  it("does nothing and logs nothing when the role does not change", async () => {
    const result = await changeTeammateRole(dependencies())(superadmin, {
      userId: "user-antho",
      role: "sales",
    });
    expect(result).toEqual({ isOk: true, value: "sales" });
    expect(state.auditEntries).toEqual([]);
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses a superadmin who changes their own role to %s",
    async (role) => {
      const result = await changeTeammateRole(dependencies())(superadmin, {
        userId: superadmin.userId,
        role,
      });
      expect(result).toEqual({ isOk: false, error: "cannot_change_own_role" });
      expect(roleOf(superadmin.userId)).toBe("superadmin");
    },
  );

  it("answers not found for someone outside the team", async () => {
    expect(
      await changeTeammateRole(dependencies())(superadmin, {
        userId: "user-client",
        role: "admin",
      }),
    ).toEqual({ isOk: false, error: "teammate_not_found" });
    expect(roleOf("user-client")).toBeNull();
  });

  it("answers not found for an unknown person", async () => {
    expect(
      await changeTeammateRole(dependencies())(superadmin, {
        userId: "user-unknown",
        role: "admin",
      }),
    ).toEqual({ isOk: false, error: "teammate_not_found" });
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses an %s, who cannot manage the team",
    async (role) => {
      await expect(
        changeTeammateRole(dependencies())(platformActorWith(role), {
          userId: "user-antho",
          role: "superadmin",
        }),
      ).rejects.toThrow(ForbiddenError);
      expect(roleOf("user-antho")).toBe("sales");
    },
  );
});

describe("removeTeammate", () => {
  it("takes the platform role away and logs the role removed", async () => {
    expect(await removeTeammate(dependencies())(superadmin, "user-antho")).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(roleOf("user-antho")).toBeNull();
    expect(state.users.map(({ id }) => id)).toContain("user-antho");
    expect(state.auditEntries).toEqual([
      {
        actorUserId: superadmin.userId,
        action: "platform.role_revoked",
        targetType: "user",
        targetId: "user-antho",
        data: { role: "sales" },
      },
    ]);
  });

  it("refuses a superadmin who removes themselves", async () => {
    expect(await removeTeammate(dependencies())(superadmin, superadmin.userId)).toEqual({
      isOk: false,
      error: "cannot_change_own_role",
    });
    expect(roleOf(superadmin.userId)).toBe("superadmin");
  });

  it("answers not found for someone outside the team", async () => {
    expect(await removeTeammate(dependencies())(superadmin, "user-client")).toEqual({
      isOk: false,
      error: "teammate_not_found",
    });
    expect(state.auditEntries).toEqual([]);
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses an %s, who cannot manage the team",
    async (role) => {
      await expect(
        removeTeammate(dependencies())(platformActorWith(role), "user-antho"),
      ).rejects.toThrow(ForbiddenError);
      expect(roleOf("user-antho")).toBe("sales");
    },
  );
});
