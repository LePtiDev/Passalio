import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies } from "../domain/customer-ports";
import { customerUpdates } from "../domain/customer-records";
import type { CustomerChanges } from "../domain/customer-schemas";

export type UpdateCustomerInput = {
  readonly customerId: string;
  readonly changes: CustomerChanges;
};

export const updateCustomer =
  ({ customers, now }: Pick<CustomerDependencies, "customers" | "now">) =>
  async (actor: Actor, input: UpdateCustomerInput): Promise<Result<void, CustomerError>> => {
    assertCan(actor, "customers:write");
    const current = await customers.findById(actor.organizationId, input.customerId);
    if (current === undefined) {
      return err("customer_not_found");
    }
    const updates = customerUpdates(current, input.changes, now());
    if (!updates.isOk) {
      return updates;
    }
    await customers.update(actor.organizationId, input.customerId, updates.value);
    return ok(undefined);
  };
