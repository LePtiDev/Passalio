import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { CursorPagination } from "@/components/pagination";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { usePagedList } from "@/lib/use-paged-list";
import type { AccountFilter } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import { useAccountsPage } from "../../hooks/use-backoffice-queries";
import { useNow } from "../../hooks/use-now";
import { ADMIN_CARD_CLASS, ADMIN_TABLE_HEADER_CLASS } from "../admin-styles";
import { AdminHeading, AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { ACCOUNT_GRID_CLASS, AccountRow } from "./account-row";
import { AccountsEmpty, AccountsSkeleton } from "./accounts-states";
import { AccountsToolbar } from "./accounts-toolbar";

const text = backofficeFr.accounts;

const SEARCH_DELAY_MS = 300;

const ACCOUNT_ROW_HEIGHTS = { mobile: 73, desktop: 59 } as const;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

type AccountsScreenProps = {
  readonly filter: AccountFilter;
  readonly search: string;
  readonly onFilterChange: (filter: AccountFilter) => void;
  readonly onSearchChange: (search: string) => void;
};

const AccountsHeader = () => (
  <div aria-hidden="true" className={`${ACCOUNT_GRID_CLASS} ${ADMIN_TABLE_HEADER_CLASS}`}>
    <span>{text.columns.company}</span>
    <span>{text.columns.subscription}</span>
    <span>{text.columns.staff}</span>
    <span>{text.columns.usage}</span>
    <span>{text.columns.lastSeen}</span>
    <span />
  </div>
);

export const AccountsScreen = ({
  filter,
  search,
  onFilterChange,
  onSearchChange,
}: AccountsScreenProps) => {
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const { measureList, ...paging } = usePagedList(
    `${filter}:${debouncedSearch}`,
    ACCOUNT_ROW_HEIGHTS,
  );
  const accounts = useAccountsPage(filter, debouncedSearch, paging.cursor, paging.pageSize);
  const { refetch } = accounts;
  const retry = useCallback(() => void refetch(), [refetch]);
  const clearSearch = useCallback(() => onSearchChange(""), [onSearchChange]);
  const showAll = useCallback(() => onFilterChange("all"), [onFilterChange]);
  const rows = accounts.data?.accounts ?? [];
  const counts = accounts.data?.counts ?? null;
  const now = useNow();

  return (
    <AdminPage
      trail={TRAIL}
      mobileTitle={text.title}
      mobileSubtitle={counts === null ? undefined : text.mobileSubtitle(counts.all, counts.trial)}
    >
      <AdminHeading
        title={text.title}
        subtitle={counts === null ? text.subtitleLoading : text.subtitle(counts.all)}
      />
      <AccountsToolbar
        search={search}
        filter={filter}
        counts={counts}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
      />
      <div ref={measureList} className="flex flex-col gap-4 lg:gap-5">
        {accounts.isPending ? <AccountsSkeleton /> : null}
        {accounts.isError ? <ErrorState error={accounts.error} onRetry={retry} /> : null}
        {accounts.isSuccess && rows.length === 0 ? (
          <AccountsEmpty
            search={debouncedSearch}
            filter={filter}
            onClearSearch={clearSearch}
            onShowAll={showAll}
          />
        ) : null}
        {accounts.isSuccess && rows.length > 0 ? (
          <div className={ADMIN_CARD_CLASS}>
            <AccountsHeader />
            <ul>
              {rows.map((account) => (
                <AccountRow key={account.id} account={account} now={now} />
              ))}
            </ul>
            <CursorPagination
              paging={paging}
              nextCursor={accounts.data?.nextCursor ?? null}
              shown={rows.length}
              total={debouncedSearch === "" && counts !== null ? counts[filter] : null}
              isLoading={accounts.isPlaceholderData}
            />
          </div>
        ) : null}
      </div>
    </AdminPage>
  );
};
