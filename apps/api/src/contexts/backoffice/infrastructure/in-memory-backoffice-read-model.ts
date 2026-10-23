import type { ActivityWindow } from "../domain/activity-window";
import type {
  AccountFilter,
  AccountProfileRow,
  AccountRow,
  BackofficeDependencies,
  BackofficeReadModel,
  JournalRow,
  MemberRow,
  MonthlyActivityRow,
  PendingInvitationRow,
} from "../domain/backoffice-ports";
import { usageTrend } from "../domain/usage-trend";

export type InMemoryAccount = AccountProfileRow & {
  readonly recent: number;
  readonly previous: number;
};

export type InMemoryInvitation = PendingInvitationRow & { readonly organizationId: string };

export type InMemoryBackofficeState = {
  readonly accounts: InMemoryAccount[];
  readonly members: MemberRow[];
  readonly monthlyActivity: MonthlyActivityRow[];
  readonly invitations: InMemoryInvitation[];
  readonly journal: JournalRow[];
  activePeople: number;
};

export const createInMemoryBackofficeState = (): InMemoryBackofficeState => ({
  accounts: [],
  members: [],
  monthlyActivity: [],
  invitations: [],
  journal: [],
  activePeople: 0,
});

export const inMemoryAccount = (
  account: Pick<InMemoryAccount, "id" | "name" | "createdAt"> & Partial<InMemoryAccount>,
): InMemoryAccount => ({
  siret: null,
  address: null,
  phone: null,
  trades: [],
  customerCount: 0,
  recent: 0,
  previous: 0,
  ...account,
});

export const inMemoryMember = (
  member: Pick<MemberRow, "organizationId" | "userId" | "name" | "role"> & Partial<MemberRow>,
): MemberRow => ({
  email: `${member.userId}@example.fr`,
  lastActiveDay: null,
  recent: 0,
  previous: 0,
  isTwoFactorEnabled: false,
  isBlocked: false,
  ...member,
});

export const inMemoryJournalRow = (
  row: Pick<JournalRow, "id" | "action" | "createdAt"> & Partial<JournalRow>,
): JournalRow => ({
  organizationId: null,
  organizationName: null,
  actorName: null,
  impersonatorName: null,
  targetName: null,
  data: null,
  ...row,
});

const toAccountRow = ({ id, name, address, createdAt, recent, previous }: InMemoryAccount) => ({
  id,
  name,
  address,
  createdAt,
  recent,
  previous,
});

const matchesFilter = (filter: AccountFilter, window: ActivityWindow) => {
  const filters: Record<AccountFilter, (account: InMemoryAccount) => boolean> = {
    all: () => true,
    trial: ({ createdAt }) => createdAt > window.trialStartedAfter,
    dropping: ({ recent, previous }) => usageTrend(recent, previous).isDropping,
  };
  return filters[filter];
};

const byNameThenId = (first: AccountRow, second: AccountRow) =>
  first.name === second.name
    ? first.id.localeCompare(second.id)
    : first.name.localeCompare(second.name);

const byNewestFirst = (first: JournalRow, second: JournalRow) =>
  first.createdAt.getTime() === second.createdAt.getTime()
    ? second.id.localeCompare(first.id)
    : second.createdAt.getTime() - first.createdAt.getTime();

export const createInMemoryBackofficeReadModel = (
  state: InMemoryBackofficeState,
): BackofficeReadModel => ({
  countAccounts: async (window) => ({
    all: state.accounts.filter(matchesFilter("all", window)).length,
    trial: state.accounts.filter(matchesFilter("trial", window)).length,
    dropping: state.accounts.filter(matchesFilter("dropping", window)).length,
  }),
  listAccounts: async (window, { filter, query, after, limit }) =>
    state.accounts
      .filter(matchesFilter(filter, window))
      .filter(({ name }) => query === undefined || name.toLowerCase().includes(query.toLowerCase()))
      .map(toAccountRow)
      .toSorted(byNameThenId)
      .filter((row) => after === undefined || byNameThenId(row, { ...row, ...after }) > 0)
      .slice(0, limit),
  membersOf: async (_window, organizationIds) =>
    state.members.filter(({ organizationId }) => organizationIds.includes(organizationId)),
  monthlyActivityOf: async (window, organizationIds) =>
    state.monthlyActivity.filter(
      ({ organizationId, month }) =>
        organizationIds.includes(organizationId) && window.months.includes(month),
    ),
  countActivePeople: async () => state.activePeople,
  findAccount: async (organizationId) => {
    const account = state.accounts.find(({ id }) => id === organizationId);
    if (account === undefined) {
      return undefined;
    }
    const { recent: _recent, previous: _previous, ...profile } = account;
    return profile;
  },
  pendingInvitationsOf: async (organizationId) =>
    state.invitations
      .filter((invitation) => invitation.organizationId === organizationId)
      .map(({ email, role, createdAt }) => ({ email, role, createdAt })),
  journal: async (scope, before, limit) =>
    state.journal
      .filter((row) =>
        "organizationId" in scope
          ? row.organizationId === scope.organizationId
          : scope.actions.includes(row.action),
      )
      .toSorted(byNewestFirst)
      .filter(
        (row) =>
          before === undefined ||
          byNewestFirst(row, inMemoryJournalRow({ action: row.action, ...before })) > 0,
      )
      .slice(0, limit),
});

export const createInMemoryBackofficeDependencies = (
  state: InMemoryBackofficeState,
  now: () => Date,
): BackofficeDependencies => ({
  readModel: createInMemoryBackofficeReadModel(state),
  now,
});
