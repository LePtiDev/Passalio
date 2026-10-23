import { assertPlatformCan, err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type { TeamDependencies } from "../domain/team-ports";
import { TEAM_INVITATION_LIFETIME_MS } from "../domain/team-rules";

export const resendTeamInvitation =
  ({ invitations, auditTrail, notifier, now }: Omit<TeamDependencies, "teammates" | "newId">) =>
  async (
    actor: PlatformActor,
    invitationId: string,
  ): Promise<Result<Date, "invitation_not_found">> => {
    assertPlatformCan(actor, "team:manage");
    const invitation = await invitations.findById(invitationId);
    if (invitation?.status !== "pending") {
      return err("invitation_not_found");
    }
    const expiresAt = new Date(now().getTime() + TEAM_INVITATION_LIFETIME_MS);
    await invitations.renew(invitation.id, expiresAt);
    await notifier.notify({ ...invitation, expiresAt }, actor.name);
    await auditTrail.record({
      actorUserId: actor.userId,
      action: "platform.invitation_resent",
      targetType: "platform_invitation",
      targetId: invitation.id,
      data: { role: invitation.role },
    });
    return ok(expiresAt);
  };

export const cancelTeamInvitation =
  ({ invitations, auditTrail }: Pick<TeamDependencies, "invitations" | "auditTrail">) =>
  async (
    actor: PlatformActor,
    invitationId: string,
  ): Promise<Result<void, "invitation_not_found">> => {
    assertPlatformCan(actor, "team:manage");
    const invitation = await invitations.findById(invitationId);
    if (invitation?.status !== "pending") {
      return err("invitation_not_found");
    }
    await invitations.cancel(invitation.id);
    await auditTrail.record({
      actorUserId: actor.userId,
      action: "platform.invitation_canceled",
      targetType: "platform_invitation",
      targetId: invitation.id,
      data: { role: invitation.role },
    });
    return ok(undefined);
  };
