import { err, ok, type OrganizationRole, type Result } from "@passalio/shared";
import type { Invitation, Member, UserActor } from "./identity-models";

export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type AssignableRole = Exclude<OrganizationRole, "owner">;

export const checkAssignableRole = (
  role: OrganizationRole,
): Result<AssignableRole, "owner_role_not_assignable"> =>
  role === "owner" ? err("owner_role_not_assignable") : ok(role);

export const checkMemberIsNotOwner = (member: Member): Result<Member, "owner_cannot_be_changed"> =>
  member.role === "owner" ? err("owner_cannot_be_changed") : ok(member);

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const checkInvitationAcceptable = (
  invitation: Invitation,
  actor: UserActor,
  now: Date,
): Result<
  Invitation,
  "invitation_not_found" | "invitation_expired" | "invitation_email_mismatch"
> => {
  if (invitation.status !== "pending") {
    return err("invitation_not_found");
  }
  if (invitation.expiresAt.getTime() <= now.getTime()) {
    return err("invitation_expired");
  }
  if (normalizeEmail(invitation.email) !== normalizeEmail(actor.email)) {
    return err("invitation_email_mismatch");
  }
  return ok(invitation);
};
