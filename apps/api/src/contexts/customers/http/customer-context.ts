import type { Bindings, Variables } from "../../../env";
import type { CustomerDependencies } from "../domain/customer-ports";
import { createCustomerDependencies } from "../infrastructure/customer-dependencies";

export const customerDependencies = (
  variables: Variables,
  bindings: Bindings,
): CustomerDependencies =>
  createCustomerDependencies({ database: variables.database, files: bindings.FILES });
