import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";
import type { OrganizationProfile } from "../domain/organization-profile";

export const getOrganizationProfile =
  ({ organizations }: Pick<IdentityDependencies, "organizations">) =>
  async (actor: Actor): Promise<Result<OrganizationProfile, IdentityError>> => {
    assertCan(actor, "organization:read");
    const profile = await organizations.findProfile(actor.organizationId);
    return profile === undefined ? err("organization_not_found") : ok(profile);
  };
