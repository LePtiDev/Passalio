import { ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryPlatformSettingsDependencies,
  createInMemoryPlatformSettingsState,
  type InMemoryPlatformSettingsState,
} from "../infrastructure/in-memory-platform-settings-dependencies";
import { changeSignUpSettings } from "./change-sign-up-settings";
import { getSignUpSettings } from "./get-sign-up-settings";

const NOW = new Date("2026-10-24T22:00:00Z");
const SUPERADMIN = platformActorWith("superadmin", { userId: "user-quentin" });

let state: InMemoryPlatformSettingsState;
const dependencies = () => createInMemoryPlatformSettingsDependencies(state, () => NOW);
const close = () => changeSignUpSettings(dependencies())(SUPERADMIN, { isSignUpOpen: false });

beforeEach(() => {
  state = createInMemoryPlatformSettingsState();
  state.userNames.set("user-quentin", "Quentin");
});

describe("getSignUpSettings", () => {
  it("shows the superadmin that sign-up is open by default", async () => {
    expect(await getSignUpSettings(dependencies())(SUPERADMIN)).toEqual({
      isSignUpOpen: true,
      changedAt: null,
      changedByName: null,
    });
  });

  it("shows who closed sign-up and when", async () => {
    await close();
    expect(await getSignUpSettings(dependencies())(SUPERADMIN)).toEqual({
      isSignUpOpen: false,
      changedAt: NOW,
      changedByName: "Quentin",
    });
  });

  it.each<PlatformRole>(["admin", "sales"])("refuses the settings to a %s", async (role) => {
    await expect(getSignUpSettings(dependencies())(platformActorWith(role))).rejects.toThrow(
      ForbiddenError,
    );
  });
});
