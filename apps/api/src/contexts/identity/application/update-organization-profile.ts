import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";
import {
  isNumberingRewound,
  normalizeProfileChanges,
  type ProfileChanges,
} from "../domain/organization-profile";

export const updateOrganizationProfile =
  ({ organizations, auditTrail }: Pick<IdentityDependencies, "organizations" | "auditTrail">) =>
  async (actor: Actor, changes: ProfileChanges): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "organization:update");
    const normalized = normalizeProfileChanges(changes);
    if (!normalized.isOk) {
      return normalized;
    }
    const profile = await organizations.findProfile(actor.organizationId);
    if (profile === undefined) {
      return err("organization_not_found");
    }
    if (isNumberingRewound(profile, normalized.value)) {
      return err("document_number_already_used");
    }
    await organizations.updateProfile(actor.organizationId, normalized.value);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "organization.updated",
      targetType: "organization",
      targetId: actor.organizationId,
      data: { fields: Object.keys(normalized.value).join(",") },
    });
    return ok(undefined);
  };
