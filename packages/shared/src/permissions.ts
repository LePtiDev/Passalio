export const PERMISSIONS = {
  "billing:manage": "write",
  "account:delete": "write",
  "ownership:transfer": "write",
  "members:read": "read",
  "members:manage": "write",
  "organization:read": "read",
  "organization:update": "write",
  "customers:read": "read",
  "customers:write": "write",
  "schedule:read": "read",
  "schedule:write": "write",
  "interventions:write-own": "write",
  "documents:sign": "write",
  "documents:read-all": "read",
  "documents:read-own": "read",
  "reminders:manage": "write",
  "data:export": "export",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const isReadPermission = (permission: Permission): boolean =>
  PERMISSIONS[permission] === "read";
