import type { OrganizationRole } from "@passalio/shared";
import type { ActivityWindow } from "./activity-window";

export const ACCOUNT_FILTERS = ["all", "trial", "dropping"] as const;
export type AccountFilter = (typeof ACCOUNT_FILTERS)[number];

export type AccountCursor = { readonly name: string; readonly id: string };

export type AccountRow = {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly createdAt: Date;
  readonly recent: number;
  readonly previous: number;
};

export type AccountCounts = { readonly [Filter in AccountFilter]: number };

export type MemberRow = {
  readonly organizationId: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: OrganizationRole;
  readonly lastActiveDay: string | null;
  readonly recent: number;
  readonly previous: number;
  readonly isTwoFactorEnabled: boolean;
  readonly isBlocked: boolean;
};

export type MonthlyActivityRow = {
  readonly organizationId: string;
  readonly userId: string;
  readonly month: string;
  readonly activeDays: number;
};

export type AccountProfileRow = {
  readonly id: string;
  readonly name: string;
  readonly siret: string | null;
  readonly address: string | null;
  readonly phone: string | null;
  readonly trades: readonly string[];
  readonly createdAt: Date;
  readonly customerCount: number;
};

export type PendingInvitationRow = {
  readonly email: string;
  readonly role: OrganizationRole;
  readonly createdAt: Date;
};

export type JournalCursor = { readonly createdAt: Date; readonly id: string };

export type JournalScope =
  | { readonly organizationId: string }
  | { readonly actions: readonly string[] };

export type JournalRow = {
  readonly id: string;
  readonly action: string;
  readonly createdAt: Date;
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly actorName: string | null;
  readonly impersonatorName: string | null;
  readonly targetName: string | null;
  readonly data: Readonly<Record<string, string>> | null;
};

export type AccountPageRequest = {
  readonly filter: AccountFilter;
  readonly query: string | undefined;
  readonly after: AccountCursor | undefined;
  readonly limit: number;
};

export type BackofficeReadModel = {
  readonly countAccounts: (window: ActivityWindow) => Promise<AccountCounts>;
  readonly listAccounts: (
    window: ActivityWindow,
    request: AccountPageRequest,
  ) => Promise<readonly AccountRow[]>;
  readonly membersOf: (
    window: ActivityWindow,
    organizationIds: readonly string[],
  ) => Promise<readonly MemberRow[]>;
  readonly monthlyActivityOf: (
    window: ActivityWindow,
    organizationIds: readonly string[],
  ) => Promise<readonly MonthlyActivityRow[]>;
  readonly countActivePeople: (window: ActivityWindow) => Promise<number>;
  readonly findAccount: (organizationId: string) => Promise<AccountProfileRow | undefined>;
  readonly pendingInvitationsOf: (
    organizationId: string,
  ) => Promise<readonly PendingInvitationRow[]>;
  readonly journal: (
    scope: JournalScope,
    before: JournalCursor | undefined,
    limit: number,
  ) => Promise<readonly JournalRow[]>;
};

export type BackofficeDependencies = {
  readonly readModel: BackofficeReadModel;
  readonly now: () => Date;
};
