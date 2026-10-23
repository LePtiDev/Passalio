import type { PlatformRole } from "@passalio/shared";
import type { PendingTeamInvitation, TeamInvitation, Teammate } from "./team-models";

export type TeammateRepository = {
  readonly list: () => Promise<readonly Teammate[]>;
  readonly findRole: (userId: string) => Promise<PlatformRole | undefined>;
  readonly findRoleByEmail: (email: string) => Promise<PlatformRole | undefined>;
  readonly changeRole: (userId: string, role: PlatformRole) => Promise<void>;
  readonly remove: (userId: string) => Promise<void>;
  readonly findName: (userId: string) => Promise<string | undefined>;
};

export type TeamInvitationRepository = {
  readonly create: (invitation: TeamInvitation) => Promise<void>;
  readonly findById: (invitationId: string) => Promise<TeamInvitation | undefined>;
  readonly findPendingByEmail: (email: string) => Promise<TeamInvitation | undefined>;
  readonly listPending: () => Promise<readonly PendingTeamInvitation[]>;
  readonly renew: (invitationId: string, expiresAt: Date) => Promise<void>;
  readonly cancel: (invitationId: string) => Promise<void>;
  readonly accept: (invitation: TeamInvitation, userId: string) => Promise<void>;
};

export type TeamAuditAction =
  | "platform.invitation_sent"
  | "platform.invitation_resent"
  | "platform.invitation_canceled"
  | "platform.invitation_accepted"
  | "platform.role_changed"
  | "platform.role_revoked";

export type TeamAuditEntry = {
  readonly actorUserId: string;
  readonly action: TeamAuditAction;
  readonly targetType: "user" | "platform_invitation";
  readonly targetId: string;
  readonly data: Readonly<Record<string, string>>;
};

export type TeamAuditTrail = {
  readonly record: (entry: TeamAuditEntry) => Promise<void>;
};

export type TeamInvitationNotifier = {
  readonly notify: (invitation: TeamInvitation, inviterName: string) => Promise<void>;
};

export type TeamDependencies = {
  readonly teammates: TeammateRepository;
  readonly invitations: TeamInvitationRepository;
  readonly auditTrail: TeamAuditTrail;
  readonly notifier: TeamInvitationNotifier;
  readonly now: () => Date;
  readonly newId: () => string;
};
