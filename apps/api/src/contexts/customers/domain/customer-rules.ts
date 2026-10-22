import { err, ok, type Result } from "@passalio/shared";
import type { CustomerError } from "./customer-error";
import type { Customer } from "./customer-models";

type NamedCustomer = Pick<Customer, "kind" | "firstName" | "lastName" | "companyName">;

export const normalizeSearchText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const displayNameOf = (customer: NamedCustomer) =>
  customer.kind === "company"
    ? (customer.companyName ?? "")
    : [customer.lastName, customer.firstName].filter((part) => part !== null).join(" ");

export const searchNameOf = (customer: NamedCustomer) =>
  normalizeSearchText(displayNameOf(customer));

export const checkCustomerName = (
  customer: NamedCustomer,
): Result<NamedCustomer, CustomerError> => {
  const requiredName = customer.kind === "company" ? customer.companyName : customer.lastName;
  return requiredName === null ? err("customer_name_required") : ok(customer);
};

export const searchRange = (query: string) => {
  const prefix = normalizeSearchText(query);
  return prefix === "" ? undefined : { from: prefix, to: `${prefix}￿` };
};

export const calendarDateOf = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
