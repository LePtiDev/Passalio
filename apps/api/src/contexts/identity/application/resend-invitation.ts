import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";
import { INVITATION_LIFETIME_MS } from "../domain/membership-rules";

export type ResendInvitationInput = {
  readonly invitationId: string;
};

export const resendInvitation =
  ({
    organizations,
    invitations,
    auditTrail,
    invitationNotifier,
    now,
  }: Pick<
    IdentityDependencies,
    "organizations" | "invitations" | "auditTrail" | "invitationNotifier" | "now"
  >) =>
  async (actor: Actor, input: ResendInvitationInput): Promise<Result<Date, IdentityError>> => {
    assertCan(actor, "members:manage");
    const invitation = await invitations.findById(actor.organizationId, input.invitationId);
    if (invitation?.status !== "pending") {
      return err("invitation_not_found");
    }
    const organization = await organizations.findById(actor.organizationId);
    if (organization === undefined) {
      return err("organization_not_found");
    }
    const expiresAt = new Date(now().getTime() + INVITATION_LIFETIME_MS);
    await invitations.renew(actor.organizationId, invitation.id, expiresAt);
    await invitationNotifier.notify({ ...invitation, expiresAt }, organization);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "invitation.resent",
      targetType: "invitation",
      targetId: invitation.id,
    });
    return ok(expiresAt);
  };
