import type { OrganizationRole } from "../src/roles";
import type { PlatformRole } from "../src/platform-permissions";

export type PermissionKind = "read" | "write" | "export";

export type CompanyPermissionRequirement = {
  readonly architectureRow: string;
  readonly kind: PermissionKind;
  readonly grantedTo: readonly OrganizationRole[];
};

export type PlatformPermissionRequirement = {
  readonly architectureRule: string;
  readonly grantedTo: readonly PlatformRole[];
};

const EVERY_COMPANY_ROLE: readonly OrganizationRole[] = [
  "owner",
  "admin",
  "secretary",
  "technician",
];

export const COMPANY_PERMISSION_REQUIREMENTS: Readonly<
  Record<string, CompanyPermissionRequirement>
> = {
  "billing:manage": {
    architectureRow: "Abonnement, suppression du compte",
    kind: "write",
    grantedTo: ["owner"],
  },
  "account:delete": {
    architectureRow: "Abonnement, suppression du compte",
    kind: "write",
    grantedTo: ["owner"],
  },
  "ownership:transfer": {
    architectureRow: "Un seul propriétaire par entreprise. Il peut transférer ce rôle",
    kind: "write",
    grantedTo: ["owner"],
  },
  "members:read": {
    architectureRow: "Équipe : un technicien voit l'équipe sans inviter ni changer de rôle",
    kind: "read",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "members:manage": {
    architectureRow: "Membres et rôles",
    kind: "write",
    grantedTo: ["owner", "admin"],
  },
  "organization:read": {
    architectureRow: "Paramètres entreprise (lecture)",
    kind: "read",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "organization:update": {
    architectureRow: "Paramètres entreprise",
    kind: "write",
    grantedTo: ["owner", "admin"],
  },
  "customers:read": {
    architectureRow: "Clients, lieux, équipements",
    kind: "read",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "customers:write": {
    architectureRow: "Clients, lieux, équipements",
    kind: "write",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "customers:archive": {
    architectureRow: "Archiver un client",
    kind: "write",
    grantedTo: ["owner", "admin", "secretary"],
  },
  "schedule:read": {
    architectureRow: "Planning de toute l'équipe (lecture)",
    kind: "read",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "schedule:write": {
    architectureRow: "Planning de toute l'équipe",
    kind: "write",
    grantedTo: ["owner", "admin", "secretary"],
  },
  "interventions:write-own": {
    architectureRow: "Ses interventions",
    kind: "write",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "documents:sign": {
    architectureRow: "Remplir et signer une attestation",
    kind: "write",
    grantedTo: ["owner", "admin", "technician"],
  },
  "documents:read-all": {
    architectureRow: "Voir toutes les attestations",
    kind: "read",
    grantedTo: ["owner", "admin", "secretary"],
  },
  "documents:read-own": {
    architectureRow: "Voir toutes les attestations (les siennes)",
    kind: "read",
    grantedTo: EVERY_COMPANY_ROLE,
  },
  "reminders:manage": {
    architectureRow: "Relances et modèles de messages",
    kind: "write",
    grantedTo: ["owner", "admin", "secretary"],
  },
  "data:export": {
    architectureRow: "Export des données",
    kind: "export",
    grantedTo: ["owner", "admin"],
  },
};

const EVERY_BACKOFFICE_ROLE: readonly PlatformRole[] = ["superadmin", "admin"];

export const PLATFORM_PERMISSION_REQUIREMENTS: Readonly<
  Record<string, PlatformPermissionRequirement>
> = {
  "platform:read": {
    architectureRule: "Le rôle sales, sans platform:read, ne voit que Commercial",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
  "accounts:create": {
    architectureRule: "admin : tout le backoffice sauf l'équipe",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
  "accounts:block": {
    architectureRule: "admin : tout le backoffice sauf l'équipe",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
  "access:manage": {
    architectureRule: "admin : tout le backoffice sauf l'équipe",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
  "accounts:impersonate": {
    architectureRule: "Impersonation réservée à superadmin et admin",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
  "billing:gift": {
    architectureRule: "admin : tout le backoffice sauf l'équipe",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
  "prospects:read": {
    architectureRule: "Permissions prospects:read et prospects:write (superadmin, admin, sales)",
    grantedTo: ["superadmin", "admin", "sales"],
  },
  "prospects:write": {
    architectureRule: "Permissions prospects:read et prospects:write (superadmin, admin, sales)",
    grantedTo: ["superadmin", "admin", "sales"],
  },
  "team:manage": {
    architectureRule: "superadmin : y compris l'équipe Passalio (team:manage)",
    grantedTo: ["superadmin"],
  },
  "settings:manage": {
    architectureRule: "superadmin : y compris les réglages de la plateforme (settings:manage)",
    grantedTo: ["superadmin"],
  },
  "mcp:connect": {
    architectureRule: "Permission mcp:connect (super admin, admin)",
    grantedTo: EVERY_BACKOFFICE_ROLE,
  },
};

export const isCompanyPermissionGranted = (role: OrganizationRole, permission: string): boolean =>
  COMPANY_PERMISSION_REQUIREMENTS[permission]?.grantedTo.includes(role) ?? false;

export const isPlatformPermissionGranted = (role: PlatformRole, permission: string): boolean =>
  PLATFORM_PERMISSION_REQUIREMENTS[permission]?.grantedTo.includes(role) ?? false;
