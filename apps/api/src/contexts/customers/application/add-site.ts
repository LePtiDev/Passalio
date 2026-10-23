import {
  assertCan,
  err,
  newId,
  ok,
  type Actor,
  type Result,
  type SiteFields,
} from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { Site } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";
import { newSite } from "../domain/customer-records";

export type AddSiteInput = {
  readonly id?: string | undefined;
  readonly customerId: string;
  readonly site: SiteFields;
};

export const addSite =
  ({ customers, sites, now }: Pick<CustomerDependencies, "customers" | "sites" | "now">) =>
  async (actor: Actor, input: AddSiteInput): Promise<Result<Site, CustomerError>> => {
    assertCan(actor, "customers:write");
    if ((await customers.findById(actor.organizationId, input.customerId)) === undefined) {
      return err("customer_not_found");
    }
    const id = input.id ?? newId();
    if (await sites.exists(id)) {
      return err("already_exists");
    }
    const site = newSite(input.site, {
      id,
      organizationId: actor.organizationId,
      customerId: input.customerId,
      at: now(),
    });
    await sites.create(site);
    return ok(site);
  };
