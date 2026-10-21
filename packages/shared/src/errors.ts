import type { Permission } from "./permissions";

export class ForbiddenError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`Forbidden: ${permission}`);
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}
