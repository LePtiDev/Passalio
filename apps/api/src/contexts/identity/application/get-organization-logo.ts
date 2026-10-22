import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies, StoredLogo } from "../domain/identity-ports";

export const getOrganizationLogo =
  ({ organizations, logoStorage }: Pick<IdentityDependencies, "organizations" | "logoStorage">) =>
  async (actor: Actor): Promise<Result<StoredLogo, IdentityError>> => {
    assertCan(actor, "organization:read");
    const profile = await organizations.findProfile(actor.organizationId);
    const logo =
      profile?.logoKey === null || profile === undefined
        ? undefined
        : await logoStorage.get(profile.logoKey);
    return logo === undefined ? err("logo_not_found") : ok(logo);
  };
