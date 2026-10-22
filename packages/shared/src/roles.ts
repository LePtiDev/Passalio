import type { Permission } from "./permissions";

export const ORGANIZATION_ROLES = ["owner", "admin", "secretary", "technician"] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const isOrganizationRole = (value: string): value is OrganizationRole =>
  ORGANIZATION_ROLES.some((role) => role === value);

const SHARED_PERMISSIONS: readonly Permission[] = [
  "members:read",
  "organization:read",
  "customers:read",
  "customers:write",
  "schedule:read",
  "interventions:write-own",
  "documents:read-own",
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...SHARED_PERMISSIONS,
  "members:manage",
  "organization:update",
  "schedule:write",
  "documents:sign",
  "documents:read-all",
  "reminders:manage",
  "data:export",
];

export const ROLE_PERMISSIONS: Readonly<Record<OrganizationRole, ReadonlySet<Permission>>> = {
  owner: new Set([...ADMIN_PERMISSIONS, "billing:manage", "account:delete", "ownership:transfer"]),
  admin: new Set(ADMIN_PERMISSIONS),
  secretary: new Set([
    ...SHARED_PERMISSIONS,
    "schedule:write",
    "documents:read-all",
    "reminders:manage",
  ]),
  technician: new Set([...SHARED_PERMISSIONS, "documents:sign"]),
};
