import { err, ok, type PlatformRole, type Result } from "@passalio/shared";
import type { TeamError } from "../domain/team-error";
import type { InvitedUser } from "../domain/team-models";
import type { TeamDependencies } from "../domain/team-ports";
import { checkTeamInvitationFor, checkTeamInvitationOpen } from "../domain/team-rules";

export type TeamInvitationDetails = {
  readonly role: PlatformRole;
  readonly email: string;
  readonly inviterName: string | null;
};

export const getTeamInvitation =
  ({ teammates, invitations, now }: Pick<TeamDependencies, "teammates" | "invitations" | "now">) =>
  async (
    invitationId: string,
  ): Promise<Result<TeamInvitationDetails, "invitation_not_found" | "invitation_expired">> => {
    const open = checkTeamInvitationOpen(await invitations.findById(invitationId), now());
    if (!open.isOk) {
      return open;
    }
    const { role, email, inviterId } = open.value;
    return ok({ role, email, inviterName: (await teammates.findName(inviterId)) ?? null });
  };

export const acceptTeamInvitation =
  ({
    teammates,
    invitations,
    auditTrail,
    now,
  }: Pick<TeamDependencies, "teammates" | "invitations" | "auditTrail" | "now">) =>
  async (user: InvitedUser, invitationId: string): Promise<Result<PlatformRole, TeamError>> => {
    const open = checkTeamInvitationOpen(await invitations.findById(invitationId), now());
    if (!open.isOk) {
      return open;
    }
    const invitation = checkTeamInvitationFor(open.value, user);
    if (!invitation.isOk) {
      return invitation;
    }
    if ((await teammates.findRole(user.userId)) !== undefined) {
      return err("already_in_team");
    }
    await invitations.accept(invitation.value, user.userId);
    await auditTrail.record({
      actorUserId: user.userId,
      action: "platform.invitation_accepted",
      targetType: "user",
      targetId: user.userId,
      data: { role: invitation.value.role, invitationId: invitation.value.id },
    });
    return ok(invitation.value.role);
  };
