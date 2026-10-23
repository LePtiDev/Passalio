import { describe, expect, it } from "vitest";
import {
  COMPANY_PERMISSION_REQUIREMENTS,
  isCompanyPermissionGranted,
  isPlatformPermissionGranted,
} from "../test/permission-requirements";
import type { Actor } from "./actor";
import { assertCan } from "./authorization";
import { ForbiddenError } from "./errors";
import { assertPlatformCan } from "./platform-authorization";
import { PLATFORM_PERMISSIONS, PLATFORM_ROLES, type PlatformRole } from "./platform-permissions";
import { PERMISSIONS, type Permission } from "./permissions";
import { ORGANIZATION_ROLES, type OrganizationRole } from "./roles";

const COMPANY_PERMISSIONS: readonly Permission[] = Object.keys(PERMISSIONS).filter(
  (key): key is Permission => key in PERMISSIONS,
);

const companyActor = (role: OrganizationRole, isImpersonating: boolean): Actor => ({
  userId: "user-assertion",
  organizationId: "organization-assertion",
  role,
  isImpersonating,
});

const isAllowedDuringImpersonation = (role: OrganizationRole, permission: Permission) =>
  isCompanyPermissionGranted(role, permission) &&
  COMPANY_PERMISSION_REQUIREMENTS[permission]?.kind === "read";

const companyCases = ORGANIZATION_ROLES.flatMap((role) =>
  COMPANY_PERMISSIONS.flatMap((permission) => [
    {
      role,
      permission,
      isImpersonating: false,
      isAllowed: isCompanyPermissionGranted(role, permission),
    },
    {
      role,
      permission,
      isImpersonating: true,
      isAllowed: isAllowedDuringImpersonation(role, permission),
    },
  ]),
);

const thrownBy = (action: () => void): unknown => {
  try {
    action();
    return null;
  } catch (error) {
    return error;
  }
};

const platformCases = PLATFORM_ROLES.flatMap((role: PlatformRole) =>
  PLATFORM_PERMISSIONS.map((permission) => ({
    role,
    permission,
    isAllowed: isPlatformPermissionGranted(role, permission),
  })),
);

describe("assertCan against the architecture role table", () => {
  it.each(companyCases.filter(({ isAllowed }) => isAllowed))(
    "lets the $role use $permission (impersonating: $isImpersonating)",
    ({ role, permission, isImpersonating }) => {
      expect(thrownBy(() => assertCan(companyActor(role, isImpersonating), permission))).toBeNull();
    },
  );

  it.each(companyCases.filter(({ isAllowed }) => !isAllowed))(
    "throws a ForbiddenError naming $permission for the $role (impersonating: $isImpersonating)",
    ({ role, permission, isImpersonating }) => {
      const error = thrownBy(() => assertCan(companyActor(role, isImpersonating), permission));
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error).toMatchObject({ permission });
    },
  );
});

describe("assertPlatformCan against the architecture platform roles", () => {
  it.each(platformCases.filter(({ isAllowed }) => isAllowed))(
    "lets the $role platform member use $permission",
    ({ role, permission }) => {
      expect(
        thrownBy(() =>
          assertPlatformCan(
            { userId: "admin-assertion", email: "matrice@passalio.com", name: "Matrice", role },
            permission,
          ),
        ),
      ).toBeNull();
    },
  );

  it.each(platformCases.filter(({ isAllowed }) => !isAllowed))(
    "throws a ForbiddenError naming $permission for the $role platform member",
    ({ role, permission }) => {
      const error = thrownBy(() =>
        assertPlatformCan(
          { userId: "admin-assertion", email: "matrice@passalio.com", name: "Matrice", role },
          permission,
        ),
      );
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error).toMatchObject({ permission });
    },
  );
});
