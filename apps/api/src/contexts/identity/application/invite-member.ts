import {
  assertCan,
  err,
  newId,
  ok,
  type Actor,
  type OrganizationRole,
  type Result,
} from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { Invitation } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";
import {
  checkAssignableRole,
  INVITATION_LIFETIME_MS,
  normalizeEmail,
  takesTechnicianSeat,
} from "../domain/membership-rules";

export type InviteMemberInput = {
  readonly email: string;
  readonly role: OrganizationRole;
};

export const inviteMember =
  ({
    organizations,
    members,
    invitations,
    auditTrail,
    invitationNotifier,
    technicianSeats,
    now,
  }: IdentityDependencies) =>
  async (actor: Actor, input: InviteMemberInput): Promise<Result<Invitation, IdentityError>> => {
    assertCan(actor, "members:manage");
    const role = checkAssignableRole(input.role);
    if (!role.isOk) {
      return role;
    }
    const email = normalizeEmail(input.email);
    if ((await members.findByEmail(actor.organizationId, email)) !== undefined) {
      return err("already_member");
    }
    const organization = await organizations.findById(actor.organizationId);
    if (organization === undefined) {
      return err("organization_not_found");
    }
    if (
      takesTechnicianSeat(role.value) &&
      !(await technicianSeats.hasFreeSeat(actor.organizationId))
    ) {
      return err("team_plan_required");
    }
    const invitation: Invitation = {
      id: newId(),
      organizationId: actor.organizationId,
      email,
      role: role.value,
      status: "pending",
      inviterId: actor.userId,
      expiresAt: new Date(now().getTime() + INVITATION_LIFETIME_MS),
    };
    await invitations.create(invitation);
    await invitationNotifier.notify(invitation, organization);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "member.invited",
      targetType: "invitation",
      targetId: invitation.id,
      data: { role: invitation.role },
    });
    return ok(invitation);
  };
