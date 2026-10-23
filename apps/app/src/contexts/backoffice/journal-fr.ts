import { isOrganizationRole } from "@passalio/shared";
import { ROLE_LABELS } from "@/contexts/identity";

type ActionData = Readonly<Record<string, string>>;

const roleLabel = (role: string | undefined) =>
  role !== undefined && isOrganizationRole(role) ? ROLE_LABELS[role].toLowerCase() : "";

const PLATFORM_ROLE_LABELS: Readonly<Record<string, string>> = {
  superadmin: "superadmin",
  support: "support",
};

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
    `a donné le rôle ${PLATFORM_ROLE_LABELS[data["role"] ?? ""] ?? ""} à ${target}`,
  "platform.role_revoked": (data, target) =>
    `a retiré le rôle ${PLATFORM_ROLE_LABELS[data["role"] ?? ""] ?? ""} à ${target}`,
};

export const unknownAction = (action: string) => `a fait l'action « ${action} » sur`;
