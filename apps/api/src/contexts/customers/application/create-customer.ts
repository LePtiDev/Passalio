import {
  assertCan,
  err,
  newId,
  ok,
  type Actor,
  type Result,
  type CustomerFields,
  type SiteFields,
} from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { Customer, Site } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";
import { newCustomer, newSite } from "../domain/customer-records";

export type CreateCustomerInput = {
  readonly id?: string | undefined;
  readonly customer: CustomerFields;
  readonly site?: (SiteFields & { readonly id?: string | undefined }) | undefined;
};

export type CreatedCustomer = {
  readonly customer: Customer;
  readonly site: Site | null;
};

export const createCustomer =
  ({ customers, sites, now }: Pick<CustomerDependencies, "customers" | "sites" | "now">) =>
  async (
    actor: Actor,
    input: CreateCustomerInput,
  ): Promise<Result<CreatedCustomer, CustomerError>> => {
    assertCan(actor, "customers:write");
    const id = input.id ?? newId();
    const siteId = input.site?.id ?? newId();
    if (
      (await customers.exists(id)) ||
      (input.site !== undefined && (await sites.exists(siteId)))
    ) {
      return err("already_exists");
    }
    const at = now();
    const customer = newCustomer(input.customer, {
      id,
      organizationId: actor.organizationId,
      createdByUserId: actor.userId,
      at,
    });
    if (!customer.isOk) {
      return customer;
    }
    const site =
      input.site === undefined
        ? undefined
        : newSite(input.site, {
            id: siteId,
            organizationId: actor.organizationId,
            customerId: id,
            at,
          });
    await customers.create(customer.value, site);
    return ok({ customer: customer.value, site: site ?? null });
  };
