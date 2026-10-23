import * as z from "zod";
import { CUSTOMER_KINDS } from "./customers";

export const namedCustomer = z.object({
  kind: z.enum(CUSTOMER_KINDS),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  companyName: z.string().nullable(),
});

export type NamedCustomer = z.infer<typeof namedCustomer>;

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

export const hasRequiredName = (customer: NamedCustomer) =>
  (customer.kind === "company" ? customer.companyName : customer.lastName) !== null;

export const calendarDateOf = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
