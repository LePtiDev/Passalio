import { err, newId, ok, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { Member, UserActor } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";
import { checkInvitationAcceptable } from "../domain/membership-rules";

export type AcceptInvitationInput = {
  readonly organizationId: string;
  readonly invitationId: string;
};

export const acceptInvitation =
  ({
    members,
    invitations,
    auditTrail,
    now,
  }: Pick<IdentityDependencies, "members" | "invitations" | "auditTrail" | "now">) =>
  async (
    actor: UserActor,
    input: AcceptInvitationInput,
  ): Promise<Result<Member, IdentityError>> => {
    if (actor.isImpersonating) {
      return err("impersonation_read_only");
    }
    const invitation = await invitations.findById(input.organizationId, input.invitationId);
    if (invitation === undefined) {
      return err("invitation_not_found");
    }
    const acceptable = checkInvitationAcceptable(invitation, actor, now());
    if (!acceptable.isOk) {
      return acceptable;
    }
    if ((await members.findByEmail(invitation.organizationId, actor.email)) !== undefined) {
      return err("already_member");
    }
    const member: Member = {
      id: newId(),
      organizationId: invitation.organizationId,
      userId: actor.userId,
      role: invitation.role,
    };
    await invitations.accept(invitation, member);
    await auditTrail.record({
      organizationId: invitation.organizationId,
      actorUserId: actor.userId,
      action: "invitation.accepted",
      targetType: "member",
      targetId: member.id,
      data: { role: member.role, invitationId: invitation.id },
    });
    return ok(member);
  };
