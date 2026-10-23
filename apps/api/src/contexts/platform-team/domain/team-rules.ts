import { err, ok, type Result, TEAM_INVITATION_LIFETIME_DAYS } from "@passalio/shared";
import type { InvitedUser, TeamInvitation } from "./team-models";

export const TEAM_INVITATION_LIFETIME_MS = TEAM_INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const checkTeamInvitationOpen = (
  invitation: TeamInvitation | undefined,
  now: Date,
): Result<TeamInvitation, "invitation_not_found" | "invitation_expired"> => {
  if (invitation?.status !== "pending") {
    return err("invitation_not_found");
  }
  if (invitation.expiresAt.getTime() <= now.getTime()) {
    return err("invitation_expired");
  }
  return ok(invitation);
};

export const checkTeamInvitationFor = (
  invitation: TeamInvitation,
  user: InvitedUser,
): Result<TeamInvitation, "invitation_email_mismatch"> =>
  normalizeEmail(invitation.email) === normalizeEmail(user.email)
    ? ok(invitation)
    : err("invitation_email_mismatch");

export const checkNotSelf = (
  actorUserId: string,
  targetUserId: string,
): Result<string, "cannot_change_own_role"> =>
  actorUserId === targetUserId ? err("cannot_change_own_role") : ok(targetUserId);
