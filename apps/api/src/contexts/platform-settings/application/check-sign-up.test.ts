import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryPlatformSettingsDependencies,
  createInMemoryPlatformSettingsState,
  type InMemoryPlatformSettingsState,
} from "../infrastructure/in-memory-platform-settings-dependencies";
import { changeSignUpSettings } from "./change-sign-up-settings";
import { canSignUp, isSignUpOpen } from "./check-sign-up";

const NOW = new Date("2026-10-24T22:00:00Z");
const SUPERADMIN = platformActorWith("superadmin", { userId: "user-quentin" });

let state: InMemoryPlatformSettingsState;
const dependencies = () => createInMemoryPlatformSettingsDependencies(state, () => NOW);
const close = () => changeSignUpSettings(dependencies())(SUPERADMIN, { isSignUpOpen: false });

beforeEach(() => {
  state = createInMemoryPlatformSettingsState();
  state.userNames.set("user-quentin", "Quentin");
});

describe("isSignUpOpen", () => {
  it("follows the latest change", async () => {
    expect(await isSignUpOpen(dependencies())()).toBe(true);
    await close();
    expect(await isSignUpOpen(dependencies())()).toBe(false);
  });
});

describe("canSignUp", () => {
  it("lets anyone sign up while sign-up is open", async () => {
    expect(await canSignUp(dependencies())("nouveau@example.fr")).toBe(true);
  });

  it("refuses a person without invitation while sign-up is closed", async () => {
    await close();
    expect(await canSignUp(dependencies())("nouveau@example.fr")).toBe(false);
  });

  it("lets an invited person sign up while sign-up is closed, whatever the case of the email", async () => {
    await close();
    state.pendingInvitations.push({
      email: "invite@example.fr",
      expiresAt: new Date("2026-10-30T00:00:00Z"),
    });
    expect(await canSignUp(dependencies())(" Invite@Example.fr ")).toBe(true);
  });

  it("refuses a person whose invitation has expired while sign-up is closed", async () => {
    await close();
    state.pendingInvitations.push({
      email: "invite@example.fr",
      expiresAt: new Date("2026-10-20T00:00:00Z"),
    });
    expect(await canSignUp(dependencies())("invite@example.fr")).toBe(false);
  });
});
