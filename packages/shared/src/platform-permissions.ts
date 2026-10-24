export const PLATFORM_ROLES = ["superadmin", "admin", "sales"] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const isPlatformRole = (value: string | null | undefined): value is PlatformRole =>
  PLATFORM_ROLES.some((role) => role === value);

export const PLATFORM_PERMISSIONS = [
  "platform:read",
  "accounts:create",
  "accounts:block",
  "access:manage",
  "accounts:impersonate",
  "billing:gift",
  "prospects:read",
  "prospects:write",
  "team:manage",
  "settings:manage",
  "mcp:connect",
] as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

const SUPERADMIN_ONLY_PERMISSIONS: ReadonlySet<PlatformPermission> = new Set([
  "team:manage",
  "settings:manage",
]);

export const PLATFORM_ROLE_PERMISSIONS: Readonly<
  Record<PlatformRole, ReadonlySet<PlatformPermission>>
> = {
  superadmin: new Set(PLATFORM_PERMISSIONS),
  admin: new Set(
    PLATFORM_PERMISSIONS.filter((permission) => !SUPERADMIN_ONLY_PERMISSIONS.has(permission)),
  ),
  sales: new Set(["prospects:read", "prospects:write"]),
};

export type PlatformActor = {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: PlatformRole;
};
