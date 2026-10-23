import { newId } from "@passalio/shared";
import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { EmailSender } from "../../../platform/email";
import type { TeamDependencies } from "../domain/team-ports";
import { createD1TeamInvitationRepository } from "./d1-team-invitation-repository";
import { createD1TeammateRepository } from "./d1-teammate-repository";

export type TeamInfrastructure = {
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly emailSender: EmailSender;
  readonly appUrl: string;
};

export const teamInvitationUrl = (appUrl: string, invitationId: string) =>
  `${appUrl}/equipe-passalio/invitations/${invitationId}`;

export const createTeamDependencies = ({
  database,
  auditTrail,
  emailSender,
  appUrl,
}: TeamInfrastructure): TeamDependencies => ({
  teammates: createD1TeammateRepository(database),
  invitations: createD1TeamInvitationRepository(database),
  auditTrail: {
    record: async (entry) => auditTrail.record({ organizationId: null, ...entry }),
  },
  notifier: {
    notify: async (invitation, inviterName) =>
      emailSender.sendTeamInvitation({
        email: invitation.email,
        inviterName,
        role: invitation.role,
        url: teamInvitationUrl(appUrl, invitation.id),
      }),
  },
  now: () => new Date(),
  newId,
});
