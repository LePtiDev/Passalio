import { isOrganizationRole } from "@passalio/shared";
import { ROLE_LABELS } from "@/contexts/identity";

type ActionData = Readonly<Record<string, string>>;

const roleLabel = (role: string | undefined) =>
  role !== undefined && isOrganizationRole(role) ? ROLE_LABELS[role].toLowerCase() : "";

const PLATFORM_ROLE_LABELS: Readonly<Record<string, string>> = {
  superadmin: "super admin",
  admin: "admin",
  sales: "commercial",
  support: "support",
};

const platformRoleLabel = (role: string | undefined) => PLATFORM_ROLE_LABELS[role ?? ""] ?? "";

export const JOURNAL_ACTIONS: Readonly<
  Record<string, (data: ActionData, target: string) => string>
> = {
  "organization.created": () => "a créé l'entreprise",
  "organization.onboarding_completed": () => "a terminé la configuration de",
  "organization.updated": () => "a modifié les informations de",
  "organization.logo_updated": () => "a changé le logo de",
  "member.invited": (data) => `a invité une personne (${roleLabel(data["role"])}) chez`,
  "invitation.accepted": (data) => `a rejoint l'équipe (${roleLabel(data["role"])}) de`,
  "invitation.canceled": () => "a annulé une invitation chez",
  "invitation.resent": () => "a renvoyé une invitation chez",
  "member.removed": () => "a retiré une personne de l'équipe de",
  "member.role_changed": (data) =>
    `a changé un rôle de ${roleLabel(data["from"])} en ${roleLabel(data["to"])} chez`,
  "ownership.transferred": () => "a transmis la propriété de",
  "platform.role_granted": (data, target) =>
    `a donné le rôle ${platformRoleLabel(data["role"])} à ${target}`,
  "platform.role_revoked": (data, target) =>
    `a retiré le rôle ${platformRoleLabel(data["role"])} à ${target}`,
  "platform.role_changed": (data, target) =>
    `a changé le rôle de ${target} de ${platformRoleLabel(data["from"])} en ${platformRoleLabel(data["to"])}`,
  "platform.invitation_sent": (data) =>
    `a invité une personne dans l'équipe Passalio (${platformRoleLabel(data["role"])})`,
  "platform.invitation_resent": () => "a renvoyé une invitation dans l'équipe Passalio",
  "platform.invitation_canceled": () => "a annulé une invitation dans l'équipe Passalio",
  "platform.invitation_accepted": (data) =>
    `a rejoint l'équipe Passalio (${platformRoleLabel(data["role"])})`,
};

export const unknownAction = (action: string) => `a fait l'action « ${action} » sur`;
