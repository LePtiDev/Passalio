import type { Bindings, Variables } from "../../../env";
import type { BillingDependencies } from "../domain/billing-ports";
import { createBillingDependencies } from "../infrastructure/billing-dependencies";

export const billingDependencies = (
  variables: Variables,
  bindings: Bindings,
): BillingDependencies =>
  createBillingDependencies({
    database: variables.database,
    auditTrail: variables.auditTrail,
    bindings,
  });
