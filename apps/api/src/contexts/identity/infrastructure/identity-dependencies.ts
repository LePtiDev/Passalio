import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { EmailSender } from "../../../platform/email";
import type { IdentityDependencies } from "../domain/identity-ports";
import { createD1InvitationRepository } from "./d1-invitation-repository";
import { createD1MemberRepository } from "./d1-member-repository";
import { createD1OrganizationRepository } from "./d1-organization-repository";

export type IdentityInfrastructure = {
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly emailSender: EmailSender;
  readonly appUrl: string;
};

export const invitationUrl = (appUrl: string, organizationId: string, invitationId: string) =>
  `${appUrl}/invitations/${organizationId}/${invitationId}`;

export const createIdentityDependencies = ({
  database,
  auditTrail,
  emailSender,
  appUrl,
}: IdentityInfrastructure): IdentityDependencies => ({
  organizations: createD1OrganizationRepository(database),
  members: createD1MemberRepository(database),
  invitations: createD1InvitationRepository(database),
  auditTrail,
  invitationNotifier: {
    notify: (invitation, organization) =>
      emailSender.sendInvitation({
        email: invitation.email,
        organizationName: organization.name,
        url: invitationUrl(appUrl, invitation.organizationId, invitation.id),
      }),
  },
  now: () => new Date(),
});
