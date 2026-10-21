import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";
import { checkMemberIsNotOwner } from "../domain/membership-rules";

export type RemoveMemberInput = {
  readonly memberId: string;
};

export const removeMember =
  ({ members, auditTrail }: Pick<IdentityDependencies, "members" | "auditTrail">) =>
  async (actor: Actor, input: RemoveMemberInput): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "members:manage");
    const member = await members.findById(actor.organizationId, input.memberId);
    if (member === undefined) {
      return err("member_not_found");
    }
    const removable = checkMemberIsNotOwner(member);
    if (!removable.isOk) {
      return removable;
    }
    await members.remove(actor.organizationId, member.id);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "member.removed",
      targetType: "member",
      targetId: member.id,
      data: { role: member.role },
    });
    return ok(undefined);
  };
