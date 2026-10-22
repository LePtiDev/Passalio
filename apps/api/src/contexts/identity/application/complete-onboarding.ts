import { assertCan, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";

export const completeOnboarding =
  ({
    organizations,
    auditTrail,
    now,
  }: Pick<IdentityDependencies, "organizations" | "auditTrail" | "now">) =>
  async (actor: Actor): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "organization:update");
    await organizations.completeOnboarding(actor.organizationId, now());
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "organization.onboarding_completed",
      targetType: "organization",
      targetId: actor.organizationId,
    });
    return ok(undefined);
  };
