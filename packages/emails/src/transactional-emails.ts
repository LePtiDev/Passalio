import type { RenderedEmail } from "./email-content";
import { renderEmail } from "./email-layout";
import { fr } from "./fr";

export type MagicLinkEmailInput = {
  readonly url: string;
};

export type PasswordResetEmailInput = {
  readonly url: string;
};

export type InvitationEmailInput = {
  readonly url: string;
  readonly organizationName: string;
  readonly inviterName: string | null;
};

const MAX_INITIALS = 2;

export const organizationInitials = (organizationName: string) => {
  const initials = organizationName
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] ?? "")
    .filter((initial) => initial !== "")
    .slice(0, MAX_INITIALS)
    .join("")
    .toLocaleUpperCase("fr");
  return initials === "" ? "P" : initials;
};

export const magicLinkEmail = ({ url }: MagicLinkEmailInput, assetsUrl: string): RenderedEmail =>
  renderEmail(
    {
      subject: fr.magicLink.subject,
      hero: { kind: "icon", icon: "key" },
      title: fr.magicLink.title,
      lead: fr.magicLink.lead,
      action: { label: fr.magicLink.action, url },
      validity: fr.magicLink.validity,
      safety: fr.magicLink.safety,
    },
    assetsUrl,
  );

export const passwordResetEmail = (
  { url }: PasswordResetEmailInput,
  assetsUrl: string,
): RenderedEmail =>
  renderEmail(
    {
      subject: fr.passwordReset.subject,
      hero: { kind: "icon", icon: "lock" },
      title: fr.passwordReset.title,
      lead: fr.passwordReset.lead,
      action: { label: fr.passwordReset.action, url },
      validity: fr.passwordReset.validity,
      safety: fr.passwordReset.safety,
    },
    assetsUrl,
  );

export const invitationEmail = (
  { url, organizationName, inviterName }: InvitationEmailInput,
  assetsUrl: string,
): RenderedEmail =>
  renderEmail(
    {
      subject:
        inviterName === null
          ? fr.invitation.subjectWithoutInviter(organizationName)
          : fr.invitation.subject(inviterName),
      hero: {
        kind: "organization",
        name: organizationName,
        initials: organizationInitials(organizationName),
        caption: inviterName === null ? null : fr.invitation.invitedBy(inviterName),
      },
      title: fr.invitation.title,
      lead: fr.invitation.lead,
      action: { label: fr.invitation.action, url },
      validity: fr.invitation.validity,
      safety: fr.invitation.safety,
    },
    assetsUrl,
  );
