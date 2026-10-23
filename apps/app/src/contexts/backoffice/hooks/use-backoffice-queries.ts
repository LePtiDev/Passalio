import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { apiErrorOf, unwrap } from "@/lib/api-client";
import { backofficeApi, type AccountFilter } from "../backoffice-api";

const ROOT_KEY = ["backoffice"] as const;

const MAX_RETRIES = 3;

const retryUnlessMissing = (failureCount: number, error: Error) =>
  apiErrorOf(error).code !== "account_not_found" && failureCount < MAX_RETRIES;

export const useOverview = () =>
  useQuery({
    queryKey: [...ROOT_KEY, "overview"],
    queryFn: async () => unwrap(await backofficeApi.fetchOverview()),
  });

export const useAccountsPage = (
  filter: AccountFilter,
  search: string,
  cursor: string | null,
  limit: number | null,
) =>
  useQuery({
    queryKey: [...ROOT_KEY, "accounts", filter, search, cursor, limit],
    queryFn:
      limit === null
        ? skipToken
        : async () => unwrap(await backofficeApi.fetchAccounts(filter, search, cursor, limit)),
    placeholderData: keepPreviousData,
  });

export const useAccountFile = (accountId: string) =>
  useQuery({
    queryKey: [...ROOT_KEY, "account", accountId],
    queryFn: async () => unwrap(await backofficeApi.fetchAccount(accountId)),
    retry: retryUnlessMissing,
  });

export const useAccountMembers = (accountId: string) =>
  useQuery({
    queryKey: [...ROOT_KEY, "account", accountId, "members"],
    queryFn: async () => unwrap(await backofficeApi.fetchAccountMembers(accountId)),
  });

export const useAccountUsage = (accountId: string) =>
  useQuery({
    queryKey: [...ROOT_KEY, "account", accountId, "usage"],
    queryFn: async () => unwrap(await backofficeApi.fetchAccountUsage(accountId)),
  });

const fetchJournalPage = (accountId: string | null, cursor: string | null, limit: number) =>
  accountId === null
    ? backofficeApi.fetchJournal(cursor, limit)
    : backofficeApi.fetchAccountJournal(accountId, cursor, limit);

export const useJournalPage = (
  accountId: string | null,
  cursor: string | null,
  limit: number | null,
) =>
  useQuery({
    queryKey: [...ROOT_KEY, "journal", accountId, cursor, limit],
    queryFn:
      limit === null
        ? skipToken
        : async () => unwrap(await fetchJournalPage(accountId, cursor, limit)),
    placeholderData: keepPreviousData,
  });
