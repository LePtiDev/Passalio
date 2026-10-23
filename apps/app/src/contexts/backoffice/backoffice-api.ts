import {
  accountFileResponse,
  accountMembersResponse,
  accountsPageResponse,
  accountUsageResponse,
  journalPageResponse,
  overviewResponse,
  PLATFORM_ROLES,
} from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

export const ACCOUNT_FILTERS = ["all", "trial", "dropping"] as const;

export type AccountFilter = (typeof ACCOUNT_FILTERS)[number];

const adminResponse = z.object({
  admin: z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(PLATFORM_ROLES),
  }),
});

export type PlatformAdmin = z.infer<typeof adminResponse>["admin"];

const query = (entries: Readonly<Record<string, string | null | undefined>>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const text = search.toString();
  return text === "" ? "" : `?${text}`;
};

export const backofficeApi = {
  fetchAdmin: () => apiRequest("/admin/me", adminResponse),
  fetchOverview: () => apiRequest("/admin/overview", overviewResponse),
  fetchAccounts: (filter: AccountFilter, search: string, cursor: string | null, limit: number) =>
    apiRequest(
      `/admin/accounts${query({ filter, q: search, cursor, limit: String(limit) })}`,
      accountsPageResponse,
    ),
  fetchAccount: (accountId: string) =>
    apiRequest(`/admin/accounts/${accountId}`, accountFileResponse),
  fetchAccountMembers: (accountId: string) =>
    apiRequest(`/admin/accounts/${accountId}/members`, accountMembersResponse),
  fetchAccountUsage: (accountId: string) =>
    apiRequest(`/admin/accounts/${accountId}/usage`, accountUsageResponse),
  fetchAccountJournal: (accountId: string, cursor: string | null, limit: number) =>
    apiRequest(
      `/admin/accounts/${accountId}/journal${query({ cursor, limit: String(limit) })}`,
      journalPageResponse,
    ),
  fetchJournal: (cursor: string | null, limit: number) =>
    apiRequest(`/admin/journal${query({ cursor, limit: String(limit) })}`, journalPageResponse),
};
