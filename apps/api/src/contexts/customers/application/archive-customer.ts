import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies } from "../domain/customer-ports";

export const archiveCustomer =
  ({ customers, now }: Pick<CustomerDependencies, "customers" | "now">) =>
  async (
    actor: Actor,
    { customerId }: { readonly customerId: string },
  ): Promise<Result<void, CustomerError>> => {
    assertCan(actor, "customers:archive");
    if ((await customers.findById(actor.organizationId, customerId)) === undefined) {
      return err("customer_not_found");
    }
    await customers.archive(actor.organizationId, customerId, now());
    return ok(undefined);
  };
