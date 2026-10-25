import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";

export const removeOrganizationLogo =
  ({
    organizations,
    logoStorage,
    auditTrail,
  }: Pick<IdentityDependencies, "organizations" | "logoStorage" | "auditTrail">) =>
  async (actor: Actor): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "organization:update");
    const profile = await organizations.findProfile(actor.organizationId);
    if (profile?.logoKey === null || profile?.logoKey === undefined) {
      return err("logo_not_found");
    }
    await organizations.setLogoKey(actor.organizationId, null);
    await logoStorage.delete(profile.logoKey);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "organization.logo_removed",
      targetType: "organization",
      targetId: actor.organizationId,
    });
    return ok(undefined);
  };
