import type { PlatformRole } from "@passalio/shared";

export type Teammate = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: PlatformRole;
  readonly isTwoFactorEnabled: boolean;
  readonly lastSignInAt: Date | null;
};

export type TeamInvitationStatus = "pending" | "accepted" | "rejected" | "canceled";

export type TeamInvitation = {
  readonly id: string;
  readonly email: string;
  readonly role: PlatformRole;
  readonly status: TeamInvitationStatus;
  readonly inviterId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
};

export type PendingTeamInvitation = {
  readonly id: string;
  readonly email: string;
  readonly role: PlatformRole;
  readonly inviterName: string | null;
  readonly sentAt: Date;
  readonly expiresAt: Date;
};

export type InvitedUser = {
  readonly userId: string;
  readonly email: string;
};

export type TeamPage = {
  readonly members: readonly Teammate[];
  readonly invitations: readonly PendingTeamInvitation[];
};
