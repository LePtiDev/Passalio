import { describe, expect, it } from "vitest";
import { ForbiddenError } from "./errors";
import { assertPlatformCan, canPlatform } from "./platform-authorization";
import type { PlatformRole } from "./platform-permissions";
import {
  changeSignUpSettingsBody,
  signUpAvailabilityResponse,
  signUpSettingsResponse,
} from "./platform-settings";

const actorWith = (role: PlatformRole) => ({
  userId: "user-1",
  email: "admin@passalio.com",
  name: "Admin",
  role,
});

describe("settings:manage", () => {
  it.each<[PlatformRole, boolean]>([
    ["superadmin", true],
    ["admin", false],
    ["sales", false],
  ])("is granted to %s: %s", (role, expected) => {
    expect(canPlatform(actorWith(role), "settings:manage")).toBe(expected);
  });

  it("refuses an admin with a forbidden error", () => {
    expect(() => assertPlatformCan(actorWith("admin"), "settings:manage")).toThrow(ForbiddenError);
  });

  it("leaves every other backoffice permission to the admin role", () => {
    expect(canPlatform(actorWith("admin"), "accounts:block")).toBe(true);
    expect(canPlatform(actorWith("admin"), "team:manage")).toBe(false);
  });
});

describe("platform settings schemas", () => {
  it("accepts a sign-up switch with a boolean only", () => {
    expect(changeSignUpSettingsBody.parse({ isSignUpOpen: false })).toEqual({
      isSignUpOpen: false,
    });
    expect(changeSignUpSettingsBody.safeParse({ isSignUpOpen: "false" }).success).toBe(false);
    expect(changeSignUpSettingsBody.safeParse({}).success).toBe(false);
  });

  it("describes the settings with who changed them and when", () => {
    const settings = {
      isSignUpOpen: false,
      changedAt: "2026-10-24T21:10:00.000Z",
      changedByName: "Quentin",
    };
    expect(signUpSettingsResponse.parse(settings)).toEqual(settings);
    expect(
      signUpSettingsResponse.parse({ isSignUpOpen: true, changedAt: null, changedByName: null }),
    ).toEqual({ isSignUpOpen: true, changedAt: null, changedByName: null });
  });

  it("tells the public sign-up screen only whether sign-up is open", () => {
    expect(signUpAvailabilityResponse.parse({ isSignUpOpen: true, extra: 1 })).toEqual({
      isSignUpOpen: true,
    });
  });
});
