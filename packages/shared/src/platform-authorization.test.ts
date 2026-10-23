import { describe, expect, it } from "vitest";
import { ForbiddenError } from "./errors";
import { assertPlatformCan, canPlatform } from "./platform-authorization";
import { isPlatformRole, type PlatformPermission, type PlatformRole } from "./platform-permissions";

const actorWith = (role: PlatformRole) => ({
  userId: "user-1",
  email: "admin@passalio.com",
  name: "Admin",
  role,
});

describe("canPlatform", () => {
  it.each<[PlatformRole, PlatformPermission, boolean]>([
    ["superadmin", "platform:read", true],
    ["superadmin", "accounts:block", true],
    ["superadmin", "billing:gift", true],
    ["support", "platform:read", true],
    ["support", "accounts:impersonate", true],
    ["support", "access:manage", true],
    ["support", "accounts:block", false],
  ])("%s on %s is %s", (role, permission, expected) => {
    expect(canPlatform(actorWith(role), permission)).toBe(expected);
  });
});

describe("assertPlatformCan", () => {
  it("throws a forbidden error naming the missing permission", () => {
    expect(() => assertPlatformCan(actorWith("support"), "accounts:block")).toThrow(ForbiddenError);
  });
});

describe("isPlatformRole", () => {
  it.each([
    ["superadmin", true],
    ["support", true],
    ["user", false],
    [null, false],
    [undefined, false],
  ])("%s is %s", (value, expected) => {
    expect(isPlatformRole(value)).toBe(expected);
  });
});
