import { err, newId, ok, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { Organization, UserActor } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";
import { normalizeOrganizationName, toSlug } from "../domain/organization-name";

export type CreateOrganizationInput = {
  readonly name: string;
};

export const createOrganization =
  ({ organizations, auditTrail }: Pick<IdentityDependencies, "organizations" | "auditTrail">) =>
  async (
    actor: UserActor,
    input: CreateOrganizationInput,
  ): Promise<Result<Organization, IdentityError>> => {
    if (actor.isImpersonating) {
      return err("impersonation_read_only");
    }
    const name = normalizeOrganizationName(input.name);
    if (!name.isOk) {
      return name;
    }
    const id = newId();
    const organization = { id, name: name.value, slug: toSlug(name.value, id) };
    const ownerMemberId = newId();
    await organizations.createWithOwner(organization, {
      id: ownerMemberId,
      organizationId: id,
      userId: actor.userId,
      role: "owner",
    });
    await auditTrail.record({
      organizationId: id,
      actorUserId: actor.userId,
      action: "organization.created",
      targetType: "organization",
      targetId: id,
    });
    return ok(organization);
  };
