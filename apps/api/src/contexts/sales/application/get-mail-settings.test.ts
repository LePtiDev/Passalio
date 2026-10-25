import { ForbiddenError, PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  aMailSettingsChange,
  createInMemoryMailSettingsDependencies,
  createInMemoryMailSettingsState,
  type InMemoryMailSettingsState,
} from "../infrastructure/in-memory-mail-settings-dependencies";
import { getMailSettings } from "./get-mail-settings";
import { saveMailSettings } from "./save-mail-settings";

const NOW = new Date("2026-10-24T08:00:00Z");

let state: InMemoryMailSettingsState;
const run = () => getMailSettings(createInMemoryMailSettingsDependencies(state, () => NOW));
const quentin = platformActorWith("superadmin", { userId: "user-superadmin", name: "Quentin" });

beforeEach(() => {
  state = createInMemoryMailSettingsState();
});

describe("getMailSettings", () => {
  it.each(PLATFORM_ROLES)("lets a %s read their own settings, empty at first", async (role) => {
    state.members.push({ id: `user-${role}-own`, name: role, email: `${role}@passalio.com` });
    expect(
      await run()(platformActorWith(role, { userId: `user-${role}-own` }), `user-${role}-own`),
    ).toEqual({
      isOk: true,
      value: {
        member: { id: `user-${role}-own`, name: role, email: `${role}@passalio.com` },
        settings: undefined,
      },
    });
  });

  it("names who made the last change", async () => {
    await saveMailSettings(createInMemoryMailSettingsDependencies(state, () => NOW))(
      quentin,
      "user-sales",
      aMailSettingsChange(),
    );
    const result = await run()(quentin, "user-sales");
    expect(result.isOk && result.value.settings?.updatedByName).toBe("Quentin");
  });

  it.each(["admin", "sales"] as const)(
    "refuses that a %s reads another member's settings",
    async (role) => {
      await expect(run()(platformActorWith(role), "user-superadmin")).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    },
  );

  it("refuses a member who is not in the Passalio team", async () => {
    expect(await run()(quentin, "user-unknown")).toEqual({
      isOk: false,
      error: "member_not_found",
    });
  });
});
