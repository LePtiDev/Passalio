import {
  assertCan,
  err,
  ok,
  type Actor,
  type OrganizationRole,
  type Result,
} from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";
import {
  checkAssignableRole,
  checkMemberIsNotOwner,
  needsNewTechnicianSeat,
} from "../domain/membership-rules";

export type ChangeMemberRoleInput = {
  readonly memberId: string;
  readonly role: OrganizationRole;
};

export const changeMemberRole =
  ({
    members,
    auditTrail,
    technicianSeats,
  }: Pick<IdentityDependencies, "members" | "auditTrail" | "technicianSeats">) =>
  async (actor: Actor, input: ChangeMemberRoleInput): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "members:manage");
    const role = checkAssignableRole(input.role);
    if (!role.isOk) {
      return role;
    }
    const member = await members.findById(actor.organizationId, input.memberId);
    if (member === undefined) {
      return err("member_not_found");
    }
    const changeable = checkMemberIsNotOwner(member);
    if (!changeable.isOk) {
      return changeable;
    }
    if (
      needsNewTechnicianSeat(member.role, role.value) &&
      !(await technicianSeats.hasFreeSeat(actor.organizationId))
    ) {
      return err("team_plan_required");
    }
    await members.updateRole(actor.organizationId, member.id, role.value);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "member.role_changed",
      targetType: "member",
      targetId: member.id,
      data: { from: member.role, to: role.value },
    });
    return ok(undefined);
  };
