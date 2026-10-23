import { keepPreviousData, skipToken, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiErrorOf, unwrap } from "@/lib/api-client";
import { salesApi, type CompanyListScope, type ContactListScope } from "../sales-api";

export const SALES_KEY = ["sales"] as const;

type PageContext = { readonly pageParam: string | null };

const MAX_RETRIES = 3;

const MISSING_CODES = new Set(["company_not_found", "contact_not_found"]);

const retryUnlessMissing = (failureCount: number, error: Error) =>
  !MISSING_CODES.has(apiErrorOf(error).code) && failureCount < MAX_RETRIES;

export const isMissingRecord = (error: unknown) => MISSING_CODES.has(apiErrorOf(error).code);

export const useProspectFilters = () =>
  useQuery({
    queryKey: [...SALES_KEY, "filters"],
    queryFn: async () => unwrap(await salesApi.fetchFilters()),
  });

export const useProspectMap = (department: string | null) =>
  useQuery({
    queryKey: [...SALES_KEY, "map", department],
    queryFn: async () => unwrap(await salesApi.fetchMap(department)),
    placeholderData: keepPreviousData,
  });

export const useCompanies = (scope: CompanyListScope) =>
  useInfiniteQuery({
    queryKey: [...SALES_KEY, "companies", scope],
    queryFn: async ({ pageParam }: PageContext) =>
      unwrap(await salesApi.fetchCompanies(scope, pageParam)),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
  });

export const useCompaniesPage = (
  scope: CompanyListScope,
  cursor: string | null,
  limit: number | null,
) =>
  useQuery({
    queryKey: [...SALES_KEY, "companies", scope, cursor, limit],
    queryFn:
      limit === null
        ? skipToken
        : async () => unwrap(await salesApi.fetchCompanies(scope, cursor, limit)),
    placeholderData: keepPreviousData,
  });

export const useCompanyFile = (companyId: string | null) =>
  useQuery({
    queryKey: [...SALES_KEY, "company", companyId],
    queryFn:
      companyId === null ? skipToken : async () => unwrap(await salesApi.fetchCompany(companyId)),
    retry: retryUnlessMissing,
  });

export const useContactsPage = (
  scope: ContactListScope,
  cursor: string | null,
  limit: number | null,
) =>
  useQuery({
    queryKey: [...SALES_KEY, "contacts", scope, cursor, limit],
    queryFn:
      limit === null
        ? skipToken
        : async () => unwrap(await salesApi.fetchContacts(scope, cursor, limit)),
    placeholderData: keepPreviousData,
  });

export const useContactFile = (contactId: string) =>
  useQuery({
    queryKey: [...SALES_KEY, "contact", contactId],
    queryFn: async () => unwrap(await salesApi.fetchContact(contactId)),
    retry: retryUnlessMissing,
  });
