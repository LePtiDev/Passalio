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
    ["superadmin", "team:manage", true],
    ["superadmin", "mcp:connect", true],
    ["admin", "platform:read", true],
    ["admin", "accounts:impersonate", true],
    ["admin", "access:manage", true],
    ["admin", "accounts:block", true],
    ["admin", "prospects:write", true],
    ["admin", "team:manage", false],
    ["admin", "mcp:connect", true],
    ["sales", "team:manage", false],
    ["sales", "prospects:read", true],
    ["sales", "prospects:write", true],
    ["sales", "platform:read", false],
    ["sales", "accounts:impersonate", false],
    ["sales", "mcp:connect", false],
  ])("%s on %s is %s", (role, permission, expected) => {
    expect(canPlatform(actorWith(role), permission)).toBe(expected);
  });
});

describe("assertPlatformCan", () => {
  it("throws a forbidden error naming the missing permission", () => {
    expect(() => assertPlatformCan(actorWith("admin"), "team:manage")).toThrow(ForbiddenError);
  });
});

describe("isPlatformRole", () => {
  it.each([
    ["superadmin", true],
    ["admin", true],
    ["sales", true],
    ["support", false],
    ["user", false],
    [null, false],
    [undefined, false],
  ])("%s is %s", (value, expected) => {
    expect(isPlatformRole(value)).toBe(expected);
  });
});
