import { ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryPlatformSettingsDependencies,
  createInMemoryPlatformSettingsState,
  type InMemoryPlatformSettingsState,
} from "../infrastructure/in-memory-platform-settings-dependencies";
import { changeSignUpSettings } from "./change-sign-up-settings";

const NOW = new Date("2026-10-24T22:00:00Z");
const SUPERADMIN = platformActorWith("superadmin", { userId: "user-quentin" });

let state: InMemoryPlatformSettingsState;
const dependencies = () => createInMemoryPlatformSettingsDependencies(state, () => NOW);
const close = () => changeSignUpSettings(dependencies())(SUPERADMIN, { isSignUpOpen: false });

beforeEach(() => {
  state = createInMemoryPlatformSettingsState();
  state.userNames.set("user-quentin", "Quentin");
});

describe("changeSignUpSettings", () => {
  it("closes sign-up and records it in the journal", async () => {
    expect(await close()).toEqual({
      isSignUpOpen: false,
      changedAt: NOW,
      changedByName: "Quentin",
    });
    expect(state.auditEntries).toEqual([
      { actorUserId: "user-quentin", action: "platform.sign_up_closed" },
    ]);
  });

  it("opens sign-up again and records it in the journal", async () => {
    await close();
    const reopened = await changeSignUpSettings(dependencies())(SUPERADMIN, { isSignUpOpen: true });
    expect(reopened.isSignUpOpen).toBe(true);
    expect(state.auditEntries.map((entry) => entry.action)).toEqual([
      "platform.sign_up_closed",
      "platform.sign_up_opened",
    ]);
  });

  it("changes nothing and writes nothing to the journal when the value is the same", async () => {
    const unchanged = await changeSignUpSettings(dependencies())(SUPERADMIN, {
      isSignUpOpen: true,
    });
    expect(unchanged.isSignUpOpen).toBe(true);
    expect(state.changes).toEqual([]);
    expect(state.auditEntries).toEqual([]);
  });

  it.each<PlatformRole>(["admin", "sales"])(
    "refuses a %s and leaves sign-up unchanged",
    async (role) => {
      await expect(
        changeSignUpSettings(dependencies())(platformActorWith(role), { isSignUpOpen: false }),
      ).rejects.toThrow(ForbiddenError);
      expect(state.changes).toEqual([]);
      expect(state.auditEntries).toEqual([]);
    },
  );
});
