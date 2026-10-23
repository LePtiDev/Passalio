import {
  isComplianceMutation,
  isCustomerMutation,
  type Actor,
  type Result,
  type SyncMutation,
} from "@passalio/shared";
import { applyComplianceMutation, complianceDependencies } from "../../compliance";
import { applyCustomerMutation, customerDependencies } from "../../customers";
import { applySchedulingMutation, schedulingDependencies } from "../../scheduling";
import type { Bindings, Variables } from "../../../env";

export const syncMutationApplier = (variables: Variables, bindings: Bindings) => {
  const applyCustomer = applyCustomerMutation(customerDependencies(variables, bindings));
  const applyScheduling = applySchedulingMutation(schedulingDependencies(variables));
  const applyCompliance = applyComplianceMutation(complianceDependencies(variables));
  return (actor: Actor, mutation: SyncMutation): Promise<Result<void, string>> => {
    if (isCustomerMutation(mutation)) {
      return applyCustomer(actor, mutation);
    }
    if (isComplianceMutation(mutation)) {
      return applyCompliance(actor, mutation);
    }
    return applyScheduling(actor, mutation);
  };
};
