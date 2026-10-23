import type { PlatformActor, PlatformRole } from "@passalio/shared";

export const platformActorWith = (
  role: PlatformRole,
  overrides: Partial<PlatformActor> = {},
): PlatformActor => ({
  userId: `user-${role}`,
  email: `${role}@passalio.com`,
  name: `Name ${role}`,
  role,
  ...overrides,
});
