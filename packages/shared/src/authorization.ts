import type { Actor } from "./actor";
import { ForbiddenError } from "./errors";
import { isReadPermission, type Permission } from "./permissions";
import { ROLE_PERMISSIONS } from "./roles";

export const can = (actor: Actor, permission: Permission): boolean => {
  if (actor.isImpersonating && !isReadPermission(permission)) {
    return false;
  }
  return ROLE_PERMISSIONS[actor.role].has(permission);
};

export const assertCan = (actor: Actor, permission: Permission): void => {
  if (!can(actor, permission)) {
    throw new ForbiddenError(permission);
  }
};
