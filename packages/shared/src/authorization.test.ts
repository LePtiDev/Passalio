import { describe, expect, it } from "vitest";
import type { Actor } from "./actor";
import { assertCan, can } from "./authorization";
import { ForbiddenError } from "./errors";
import type { Permission } from "./permissions";
import type { OrganizationRole } from "./roles";

const actorWith = (role: OrganizationRole, isImpersonating = false): Actor => ({
  userId: "user-1",
  organizationId: "organization-1",
  role,
  isImpersonating,
});

describe("can", () => {
  it.each<[OrganizationRole, Permission, boolean]>([
    ["owner", "billing:manage", true],
    ["admin", "billing:manage", false],
    ["admin", "members:manage", true],
    ["secretary", "members:manage", false],
    ["secretary", "documents:sign", false],
    ["technician", "documents:sign", true],
    ["technician", "documents:read-all", false],
    ["technician", "documents:read-own", true],
    ["technician", "schedule:read", true],
    ["technician", "schedule:write", false],
    ["secretary", "reminders:manage", true],
    ["technician", "reminders:manage", false],
    ["admin", "data:export", true],
    ["secretary", "data:export", false],
  ])("%s / %s → %s", (role, permission, expected) => {
    expect(can(actorWith(role), permission)).toBe(expected);
  });

  it("allows reads during impersonation", () => {
    expect(can(actorWith("owner", true), "customers:read")).toBe(true);
  });

  it("refuses every write during impersonation", () => {
    expect(can(actorWith("owner", true), "customers:write")).toBe(false);
    expect(can(actorWith("owner", true), "documents:sign")).toBe(false);
  });
});

describe("assertCan", () => {
  it("passes when allowed", () => {
    expect(() => assertCan(actorWith("technician"), "documents:sign")).not.toThrow();
  });

  it("throws a ForbiddenError naming the permission", () => {
    expect(() => assertCan(actorWith("secretary"), "documents:sign")).toThrow(
      new ForbiddenError("documents:sign"),
    );
  });
});

describe("export during impersonation", () => {
  it("is refused even though export only reads data", () => {
    expect(can(actorWith("owner", true), "data:export")).toBe(false);
  });
});
