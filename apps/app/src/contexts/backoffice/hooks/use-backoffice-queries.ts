import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiErrorOf, unwrap } from "@/lib/api-client";
import { backofficeApi, type AccountFilter } from "../backoffice-api";

const ROOT_KEY = ["backoffice"] as const;

type PageContext = { readonly pageParam: string | null };

const MAX_RETRIES = 3;

const retryUnlessMissing = (failureCount: number, error: Error) =>
  apiErrorOf(error).code !== "account_not_found" && failureCount < MAX_RETRIES;

export const useOverview = () =>
  useQuery({
    queryKey: [...ROOT_KEY, "overview"],
    queryFn: async () => unwrap(await backofficeApi.fetchOverview()),
  });

export const useAccounts = (filter: AccountFilter, search: string) =>
  useInfiniteQuery({
    queryKey: [...ROOT_KEY, "accounts", filter, search],
    queryFn: async ({ pageParam }: PageContext) =>
      unwrap(await backofficeApi.fetchAccounts(filter, search, pageParam)),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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

export const useJournal = (accountId: string | null) =>
  useInfiniteQuery({
    queryKey: [...ROOT_KEY, "journal", accountId],
    queryFn: async ({ pageParam }: PageContext) =>
      unwrap(
        await (accountId === null
          ? backofficeApi.fetchJournal(pageParam)
          : backofficeApi.fetchAccountJournal(accountId, pageParam)),
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
