import {
  err,
  hasRequiredName,
  normalizeSearchText,
  ok,
  type NamedCustomer,
  type Result,
} from "@passalio/shared";
import type { CustomerError } from "./customer-error";

export const checkCustomerName = (customer: NamedCustomer): Result<NamedCustomer, CustomerError> =>
  hasRequiredName(customer) ? ok(customer) : err("customer_name_required");

export const searchRange = (query: string) => {
  const prefix = normalizeSearchText(query);
  return prefix === "" ? undefined : { from: prefix, to: `${prefix}￿` };
};
