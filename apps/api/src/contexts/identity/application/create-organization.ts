import { err, newId, ok, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { Organization, UserActor } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";
import { toSlug } from "../domain/organization-name";
import {
  normalizeProfileChanges,
  type OptionalCompanyDetails,
} from "../domain/organization-profile";

export type CreateOrganizationInput = OptionalCompanyDetails & {
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
    const normalized = normalizeProfileChanges(input);
    if (!normalized.isOk) {
      return normalized;
    }
    const { name = input.name, siret, address, phone, teamSize } = normalized.value;
    const id = newId();
    const organization = { id, name, slug: toSlug(name, id) };
    const ownerMemberId = newId();
    const details = {
      siret: siret ?? null,
      address: address ?? null,
      phone: phone ?? null,
      teamSize: teamSize ?? null,
    };
    await organizations.createWithOwner(
      { ...organization, ...details },
      {
        id: ownerMemberId,
        organizationId: id,
        userId: actor.userId,
        role: "owner",
      },
    );
    await auditTrail.record({
      organizationId: id,
      actorUserId: actor.userId,
      action: "organization.created",
      targetType: "organization",
      targetId: id,
    });
    return ok(organization);
  };
