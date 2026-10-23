import type { ProspectCompanyFileResponse } from "@passalio/shared";

export const callablePhoneOf = ({
  company,
  contacts,
}: Pick<ProspectCompanyFileResponse, "company" | "contacts">) =>
  company.phone ??
  contacts.find((contact) => contact.isMain)?.phone ??
  contacts.map((contact) => contact.phone ?? contact.mobile).find((phone) => phone !== null) ??
  null;

export const leaderNameOf = ({ contacts }: Pick<ProspectCompanyFileResponse, "contacts">) =>
  contacts.find((contact) => contact.isLeader)?.name ?? null;

export const townOf = ({ company }: Pick<ProspectCompanyFileResponse, "company">) =>
  [company.postalCode, company.city].filter((part) => part !== null).join(" ") ||
  company.department;
