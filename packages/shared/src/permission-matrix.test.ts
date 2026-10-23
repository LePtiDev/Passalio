import { describe, expect, it } from "vitest";
import {
  COMPANY_PERMISSION_REQUIREMENTS,
  isCompanyPermissionGranted,
  isPlatformPermissionGranted,
  PLATFORM_PERMISSION_REQUIREMENTS,
} from "../test/permission-requirements";
import type { Actor } from "./actor";
import { can } from "./authorization";
import { canPlatform } from "./platform-authorization";
import {
  PLATFORM_PERMISSIONS,
  PLATFORM_ROLES,
  type PlatformActor,
  type PlatformRole,
} from "./platform-permissions";
import { isReadPermission, PERMISSIONS, type Permission } from "./permissions";
import { ORGANIZATION_ROLES, type OrganizationRole } from "./roles";

const COMPANY_PERMISSIONS: readonly Permission[] = Object.keys(PERMISSIONS).filter(
  (key): key is Permission => key in PERMISSIONS,
);

const sorted = (values: readonly string[]) =>
  values.toSorted((left, right) => left.localeCompare(right));

const companyActor = (role: OrganizationRole, isImpersonating: boolean): Actor => ({
  userId: "user-matrix",
  organizationId: "organization-matrix",
  role,
  isImpersonating,
});

const platformActor = (role: PlatformRole): PlatformActor => ({
  userId: "admin-matrix",
  email: "matrice@passalio.com",
  name: "Matrice",
  role,
});

const companyCases = ORGANIZATION_ROLES.flatMap((role) =>
  COMPANY_PERMISSIONS.map(
    (permission) => [role, permission, isCompanyPermissionGranted(role, permission)] as const,
  ),
);

const platformCases = PLATFORM_ROLES.flatMap((role) =>
  PLATFORM_PERMISSIONS.map(
    (permission) => [role, permission, isPlatformPermissionGranted(role, permission)] as const,
  ),
);

describe("company permission matrix", () => {
  it("knows exactly the four company roles of the architecture", () => {
    expect([...ORGANIZATION_ROLES]).toEqual(["owner", "admin", "secretary", "technician"]);
  });

  it("lists every permission of the code in the architecture role table, and no other", () => {
    expect(sorted(COMPANY_PERMISSIONS)).toEqual(
      sorted(Object.keys(COMPANY_PERMISSION_REQUIREMENTS)),
    );
  });

  it.each(COMPANY_PERMISSIONS)(
    "%s has the read, write or export kind of the table",
    (permission) => {
      expect(PERMISSIONS[permission]).toBe(COMPANY_PERMISSION_REQUIREMENTS[permission]?.kind);
    },
  );

  it.each(companyCases)(
    "the %s outside impersonation gets %s: %s",
    (role, permission, expected) => {
      expect(can(companyActor(role, false), permission)).toBe(expected);
    },
  );

  it.each(companyCases)(
    "the %s seen during an impersonation gets %s only when it is a granted read",
    (role, permission, granted) => {
      expect(can(companyActor(role, true), permission)).toBe(
        granted && COMPANY_PERMISSION_REQUIREMENTS[permission]?.kind === "read",
      );
    },
  );

  it.each(COMPANY_PERMISSIONS)(
    "%s is a read permission only when the table says so",
    (permission) => {
      expect(isReadPermission(permission)).toBe(
        COMPANY_PERMISSION_REQUIREMENTS[permission]?.kind === "read",
      );
    },
  );
});

describe("platform permission matrix", () => {
  it("knows exactly the three platform roles of the architecture", () => {
    expect([...PLATFORM_ROLES]).toEqual(["superadmin", "admin", "sales"]);
  });

  it("lists every platform permission of the code in the requirements, and no other", () => {
    expect(sorted(PLATFORM_PERMISSIONS)).toEqual(
      sorted(Object.keys(PLATFORM_PERMISSION_REQUIREMENTS)),
    );
  });

  it.each(platformCases)("the %s platform member gets %s: %s", (role, permission, expected) => {
    expect(canPlatform(platformActor(role), permission)).toBe(expected);
  });
});
