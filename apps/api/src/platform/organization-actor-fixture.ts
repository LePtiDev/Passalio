import type { Actor, OrganizationRole } from "@passalio/shared";

export const organizationActorWith = (
  role: OrganizationRole,
  overrides: Partial<Actor> = {},
): Actor => ({
  userId: `user-${role}`,
  organizationId: "organization-a",
  role,
  isImpersonating: false,
  ...overrides,
});
