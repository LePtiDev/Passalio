import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { EmailSender } from "../../../platform/email";
import type { Logger } from "../../../platform/logger";
import type { TechnicianSeats } from "../../../platform/technician-seats";
import type { IdentityDependencies, SignUpPolicy } from "../domain/identity-ports";
import { createD1InvitationRepository } from "./d1-invitation-repository";
import { createD1MemberRepository } from "./d1-member-repository";
import { createD1OrganizationRepository } from "./d1-organization-repository";
import { createR2LogoStorage } from "./r2-logo-storage";
import { createSireneCompanyDirectory } from "./sirene-company-directory";

export type IdentityInfrastructure = {
  readonly signUpPolicy: SignUpPolicy;
  readonly technicianSeats: TechnicianSeats;
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly emailSender: EmailSender;
  readonly files: R2Bucket;
  readonly logger: Logger;
  readonly appUrl: string;
};

export const invitationUrl = (appUrl: string, organizationId: string, invitationId: string) =>
  `${appUrl}/invitations/${organizationId}/${invitationId}`;

export const createIdentityDependencies = ({
  signUpPolicy,
  technicianSeats,
  database,
  auditTrail,
  emailSender,
  files,
  logger,
  appUrl,
}: IdentityInfrastructure): IdentityDependencies => {
  const members = createD1MemberRepository(database);
  return {
    signUpPolicy,
    technicianSeats,
    organizations: createD1OrganizationRepository(database),
    members,
    invitations: createD1InvitationRepository(database),
    auditTrail,
    invitationNotifier: {
      notify: async (invitation, organization) =>
        emailSender.sendInvitation({
          email: invitation.email,
          organizationName: organization.name,
          inviterName:
            (await members.findName(invitation.organizationId, invitation.inviterId)) ?? null,
          url: invitationUrl(appUrl, invitation.organizationId, invitation.id),
        }),
    },
    logoStorage: createR2LogoStorage(files),
    companyDirectory: createSireneCompanyDirectory(logger),
    now: () => new Date(),
  };
};
