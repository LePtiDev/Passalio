import type { Permission } from "./permissions";
import type { PlatformPermission } from "./platform-permissions";

export class ForbiddenError extends Error {
  readonly permission: Permission | PlatformPermission;

  constructor(permission: Permission | PlatformPermission) {
    super(`Forbidden: ${permission}`);
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}
