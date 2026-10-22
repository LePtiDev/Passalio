import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";

export type CancelInvitationInput = {
  readonly invitationId: string;
};

export const cancelInvitation =
  ({ invitations, auditTrail }: Pick<IdentityDependencies, "invitations" | "auditTrail">) =>
  async (actor: Actor, input: CancelInvitationInput): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "members:manage");
    const invitation = await invitations.findById(actor.organizationId, input.invitationId);
    if (invitation?.status !== "pending") {
      return err("invitation_not_found");
    }
    await invitations.cancel(actor.organizationId, invitation.id);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "invitation.canceled",
      targetType: "invitation",
      targetId: invitation.id,
      data: { role: invitation.role },
    });
    return ok(undefined);
  };
