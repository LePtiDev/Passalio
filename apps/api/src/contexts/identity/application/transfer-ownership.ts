import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";

export type TransferOwnershipInput = {
  readonly memberId: string;
};

export const transferOwnership =
  ({ members, auditTrail }: Pick<IdentityDependencies, "members" | "auditTrail">) =>
  async (actor: Actor, input: TransferOwnershipInput): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "ownership:transfer");
    const target = await members.findById(actor.organizationId, input.memberId);
    if (target === undefined || target.userId === actor.userId) {
      return err("member_not_found");
    }
    if (target.role !== "admin") {
      return err("transfer_target_not_admin");
    }
    const current = await members.findByUserId(actor.organizationId, actor.userId);
    if (current === undefined) {
      return err("member_not_found");
    }
    await members.transferOwnership(actor.organizationId, current.id, target.id);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "ownership.transferred",
      targetType: "member",
      targetId: target.id,
      data: { previousOwnerMemberId: current.id },
    });
    return ok(undefined);
  };
