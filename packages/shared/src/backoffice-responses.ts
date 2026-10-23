import * as z from "zod";
import { ORGANIZATION_ROLES } from "./roles";

const organizationRole = z.enum(ORGANIZATION_ROLES);

export const usageTrendResponse = z.object({
  recent: z.number(),
  previous: z.number(),
  changePercent: z.number().nullable(),
  isDropping: z.boolean(),
});

export const monthlyActivityResponse = z.object({ month: z.string(), activeDays: z.number() });

export const accountSummaryResponse = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  createdAt: z.string(),
  trialEndsAt: z.string(),
  isInTrial: z.boolean(),
  staffCount: z.number(),
  staff: z.array(z.object({ id: z.string(), name: z.string(), role: organizationRole })),
  monthlyActivity: z.array(monthlyActivityResponse),
  trend: usageTrendResponse,
  lastActive: z.object({ day: z.string(), name: z.string() }).nullable(),
});

export const accountCountsResponse = z.object({
  all: z.number(),
  trial: z.number(),
  dropping: z.number(),
});

export const accountsPageResponse = z.object({
  accounts: z.array(accountSummaryResponse),
  counts: accountCountsResponse,
  nextCursor: z.string().nullable(),
});

export const journalEntryResponse = z.object({
  id: z.string(),
  action: z.string(),
  createdAt: z.string(),
  organization: z.object({ id: z.string(), name: z.string() }).nullable(),
  actorName: z.string().nullable(),
  impersonatorName: z.string().nullable(),
  targetName: z.string().nullable(),
  data: z.record(z.string(), z.string()).nullable(),
});

export const journalPageResponse = z.object({
  entries: z.array(journalEntryResponse),
  nextCursor: z.string().nullable(),
});

export const overviewResponse = z.object({
  counts: accountCountsResponse.extend({
    endingSoon: z.number(),
    activePeople: z.number(),
  }),
  dropping: z.array(accountSummaryResponse),
  endingTrials: z.array(accountSummaryResponse),
  movements: z.array(journalEntryResponse),
});

export const accountFileResponse = z.object({
  account: z.object({
    id: z.string(),
    name: z.string(),
    siret: z.string().nullable(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    trades: z.array(z.string()),
    createdAt: z.string(),
    trialEndsAt: z.string(),
    isInTrial: z.boolean(),
    customerCount: z.number(),
  }),
  owner: z.object({ name: z.string(), email: z.string() }).nullable(),
  staffCount: z.number(),
  trend: usageTrendResponse,
});

export const accountMembersResponse = z.object({
  members: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      email: z.string(),
      role: organizationRole,
      lastActiveDay: z.string().nullable(),
      trend: usageTrendResponse,
      isTwoFactorEnabled: z.boolean(),
      isBlocked: z.boolean(),
    }),
  ),
  invitations: z.array(
    z.object({ email: z.string(), role: organizationRole, createdAt: z.string() }),
  ),
});

export const accountUsageResponse = z.object({
  months: z.array(monthlyActivityResponse),
  trend: usageTrendResponse,
  people: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      role: organizationRole,
      months: z.array(monthlyActivityResponse),
      trend: usageTrendResponse,
    }),
  ),
});

export type MonthlyActivityResponse = z.infer<typeof monthlyActivityResponse>;
export type UsageTrendResponse = z.infer<typeof usageTrendResponse>;
export type AccountSummaryResponse = z.infer<typeof accountSummaryResponse>;
export type AccountsPageResponse = z.infer<typeof accountsPageResponse>;
export type JournalEntryResponse = z.infer<typeof journalEntryResponse>;
export type JournalPageResponse = z.infer<typeof journalPageResponse>;
export type OverviewResponse = z.infer<typeof overviewResponse>;
export type AccountFileResponse = z.infer<typeof accountFileResponse>;
export type AccountMembersResponse = z.infer<typeof accountMembersResponse>;
export type AccountUsageResponse = z.infer<typeof accountUsageResponse>;
