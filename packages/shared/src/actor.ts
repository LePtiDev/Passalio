import type { OrganizationRole } from "./roles";

export type Actor = {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
  readonly isImpersonating: boolean;
};
