import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies } from "../domain/customer-ports";
import type { SiteChanges } from "../domain/customer-schemas";

export type UpdateSiteInput = {
  readonly siteId: string;
  readonly changes: SiteChanges;
};

export const updateSite =
  ({ sites, now }: Pick<CustomerDependencies, "sites" | "now">) =>
  async (actor: Actor, input: UpdateSiteInput): Promise<Result<void, CustomerError>> => {
    assertCan(actor, "customers:write");
    if ((await sites.findById(actor.organizationId, input.siteId)) === undefined) {
      return err("site_not_found");
    }
    await sites.update(actor.organizationId, input.siteId, { ...input.changes, updatedAt: now() });
    return ok(undefined);
  };
