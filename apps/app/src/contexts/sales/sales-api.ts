import {
  prospectCompaniesPageResponse,
  prospectCompanyFileResponse,
  prospectContactFileResponse,
  prospectContactResponse,
  prospectContactsPageResponse,
  prospectFiltersResponse,
  type ContactFilter,
  type ProspectCompanyChanges,
  type ProspectCompanyFields,
  type ProspectContactChanges,
  type ProspectContactFields,
  type ProspectNote,
  type ProspectStage,
} from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const BASE = "/admin/prospects";

const created = z.object({ id: z.string() });

const nothing = z.undefined();

export type CompanyListScope = {
  readonly stage: ProspectStage | null;
  readonly department: string | null;
  readonly owner: string | null;
  readonly search: string;
};

export type ContactListScope = {
  readonly filter: ContactFilter;
  readonly department: string | null;
  readonly search: string;
};

const query = (entries: Readonly<Record<string, string | null>>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const text = search.toString();
  return text === "" ? "" : `?${text}`;
};

export const salesApi = {
  fetchFilters: () => apiRequest(`${BASE}/filters`, prospectFiltersResponse),
  fetchCompanies: (scope: CompanyListScope, cursor: string | null) =>
    apiRequest(
      `${BASE}/companies${query({
        stage: scope.stage,
        department: scope.department,
        owner: scope.owner,
        q: scope.search,
        cursor,
      })}`,
      prospectCompaniesPageResponse,
    ),
  fetchCompany: (companyId: string) =>
    apiRequest(`${BASE}/companies/${companyId}`, prospectCompanyFileResponse),
  createCompany: (fields: ProspectCompanyFields) =>
    apiRequest(`${BASE}/companies`, created, { method: "POST", body: fields }),
  updateCompany: (companyId: string, changes: ProspectCompanyChanges) =>
    apiRequest(`${BASE}/companies/${companyId}`, nothing, { method: "PATCH", body: changes }),
  deleteCompany: (companyId: string) =>
    apiRequest(`${BASE}/companies/${companyId}`, nothing, { method: "DELETE" }),
  changeStage: (companyId: string, stage: ProspectStage) =>
    apiRequest(`${BASE}/companies/${companyId}/stage`, nothing, {
      method: "POST",
      body: { stage },
    }),
  addNote: (companyId: string, note: ProspectNote) =>
    apiRequest(`${BASE}/companies/${companyId}/notes`, created, {
      method: "POST",
      body: note,
    }),
  addContact: (companyId: string, fields: ProspectContactFields) =>
    apiRequest(`${BASE}/companies/${companyId}/contacts`, prospectContactResponse, {
      method: "POST",
      body: fields,
    }),
  fetchContacts: (scope: ContactListScope, cursor: string | null) =>
    apiRequest(
      `${BASE}/contacts${query({
        filter: scope.filter,
        department: scope.department,
        q: scope.search,
        cursor,
      })}`,
      prospectContactsPageResponse,
    ),
  fetchContact: (contactId: string) =>
    apiRequest(`${BASE}/contacts/${contactId}`, prospectContactFileResponse),
  updateContact: (contactId: string, changes: ProspectContactChanges) =>
    apiRequest(`${BASE}/contacts/${contactId}`, nothing, { method: "PATCH", body: changes }),
  deleteContact: (contactId: string) =>
    apiRequest(`${BASE}/contacts/${contactId}`, nothing, { method: "DELETE" }),
};
