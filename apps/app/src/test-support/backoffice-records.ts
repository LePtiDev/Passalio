import type {
  AccountFileResponse,
  AccountMembersResponse,
  AccountSummaryResponse,
  AccountUsageResponse,
  JournalEntryResponse,
  OverviewResponse,
  PendingTeamInvitationResponse,
  TeammateResponse,
  UsageTrendResponse,
} from "@passalio/shared";

export const STEADY_TREND: UsageTrendResponse = {
  recent: 12,
  previous: 12,
  changePercent: 0,
  isDropping: false,
};

export const DROPPING_TREND: UsageTrendResponse = {
  recent: 6,
  previous: 15,
  changePercent: -60,
  isDropping: true,
};

const SIX_MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"].map(
  (month, index) => ({ month, activeDays: 10 + index }),
);

export const accountSummary = (
  id: string,
  name: string,
  overrides: Partial<AccountSummaryResponse> = {},
): AccountSummaryResponse => ({
  id,
  name,
  address: "12 rue des Lilas, 94200 Ivry-sur-Seine",
  createdAt: "2026-09-01T08:00:00.000Z",
  trialEndsAt: "2026-10-29T08:00:00.000Z",
  isInTrial: true,
  staffCount: 2,
  staff: [
    { id: `${id}-owner`, name: "Paul Martin", role: "owner" },
    { id: `${id}-technician`, name: "Léa Petit", role: "technician" },
  ],
  monthlyActivity: SIX_MONTHS,
  trend: STEADY_TREND,
  lastActive: { day: "2026-10-22", name: "Paul Martin" },
  ...overrides,
});

export const journalEntry = (
  id: string,
  overrides: Partial<JournalEntryResponse> = {},
): JournalEntryResponse => ({
  id,
  action: "organization.created",
  createdAt: "2026-10-20T09:30:00.000Z",
  organization: { id: "account-1", name: "Ramonage Martin" },
  actorName: "Paul Martin",
  impersonatorName: null,
  targetName: null,
  data: null,
  ...overrides,
});

export const overview = (overrides: Partial<OverviewResponse> = {}): OverviewResponse => ({
  counts: { all: 0, trial: 0, dropping: 0, endingSoon: 0, activePeople: 0 },
  dropping: [],
  endingTrials: [],
  movements: [],
  ...overrides,
});

export const accountFile = (
  id: string,
  name: string,
  overrides: Partial<AccountFileResponse> = {},
): AccountFileResponse => ({
  account: {
    id,
    name,
    siret: "12345678900012",
    address: "12 rue des Lilas, 94200 Ivry-sur-Seine",
    phone: "01 23 45 67 89",
    trades: ["chimney_sweeping"],
    createdAt: "2026-09-01T08:00:00.000Z",
    trialEndsAt: "2026-10-29T08:00:00.000Z",
    isInTrial: true,
    customerCount: 40,
  },
  owner: { name: "Paul Martin", email: "paul@ramonage-martin.test" },
  staffCount: 2,
  trend: STEADY_TREND,
  ...overrides,
});

export const accountMembers = (
  overrides: Partial<AccountMembersResponse> = {},
): AccountMembersResponse => ({
  members: [
    {
      userId: "member-1",
      name: "Paul Martin",
      email: "paul@ramonage-martin.test",
      role: "owner",
      lastActiveDay: "2026-10-22",
      trend: STEADY_TREND,
      isTwoFactorEnabled: true,
      isBlocked: false,
    },
  ],
  invitations: [],
  ...overrides,
});

export const accountUsage = (
  overrides: Partial<AccountUsageResponse> = {},
): AccountUsageResponse => ({
  months: SIX_MONTHS,
  trend: STEADY_TREND,
  people: [
    {
      userId: "member-1",
      name: "Paul Martin",
      role: "owner",
      months: SIX_MONTHS,
      trend: STEADY_TREND,
    },
  ],
  ...overrides,
});

export const teammate = (
  id: string,
  name: string,
  overrides: Partial<TeammateResponse> = {},
): TeammateResponse => ({
  id,
  name,
  email: `${id}@passalio.test`,
  role: "admin",
  isTwoFactorEnabled: true,
  lastSignInAt: "2026-10-22T08:00:00.000Z",
  ...overrides,
});

export const teamInvitation = (
  id: string,
  email: string,
  overrides: Partial<PendingTeamInvitationResponse> = {},
): PendingTeamInvitationResponse => ({
  id,
  email,
  role: "sales",
  inviterName: "Quentin Admin",
  sentAt: "2026-10-21T08:00:00.000Z",
  expiresAt: "2026-10-28T08:00:00.000Z",
  ...overrides,
});
