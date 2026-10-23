import { ForbiddenError } from "./errors";
import {
  PLATFORM_ROLE_PERMISSIONS,
  type PlatformActor,
  type PlatformPermission,
} from "./platform-permissions";

export const canPlatform = (actor: PlatformActor, permission: PlatformPermission): boolean =>
  PLATFORM_ROLE_PERMISSIONS[actor.role].has(permission);

export const assertPlatformCan = (actor: PlatformActor, permission: PlatformPermission): void => {
  if (!canPlatform(actor, permission)) {
    throw new ForbiddenError(permission);
  }
};
