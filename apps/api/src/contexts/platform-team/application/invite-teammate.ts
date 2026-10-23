import {
  assertPlatformCan,
  err,
  ok,
  type InviteTeammateBody,
  type PlatformActor,
  type Result,
} from "@passalio/shared";
import type { TeamError } from "../domain/team-error";
import type { TeamInvitation } from "../domain/team-models";
import type { TeamDependencies } from "../domain/team-ports";
import { normalizeEmail, TEAM_INVITATION_LIFETIME_MS } from "../domain/team-rules";

export const inviteTeammate =
  ({ teammates, invitations, auditTrail, notifier, now, newId }: TeamDependencies) =>
  async (
    actor: PlatformActor,
    input: InviteTeammateBody,
  ): Promise<Result<TeamInvitation, TeamError>> => {
    assertPlatformCan(actor, "team:manage");
    const email = normalizeEmail(input.email);
    if ((await teammates.findRoleByEmail(email)) !== undefined) {
      return err("already_in_team");
    }
    const previous = await invitations.findPendingByEmail(email);
    if (previous !== undefined) {
      await invitations.cancel(previous.id);
    }
    const sentAt = now();
    const invitation: TeamInvitation = {
      id: newId(),
      email,
      role: input.role,
      status: "pending",
      inviterId: actor.userId,
      expiresAt: new Date(sentAt.getTime() + TEAM_INVITATION_LIFETIME_MS),
      createdAt: sentAt,
    };
    await invitations.create(invitation);
    await notifier.notify(invitation, actor.name);
    await auditTrail.record({
      actorUserId: actor.userId,
      action: "platform.invitation_sent",
      targetType: "platform_invitation",
      targetId: invitation.id,
      data: { role: invitation.role },
    });
    return ok(invitation);
  };
