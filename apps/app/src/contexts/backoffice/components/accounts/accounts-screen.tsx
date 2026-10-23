import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AccountFilter } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import { useAccounts } from "../../hooks/use-backoffice-queries";
import { useNow } from "../../hooks/use-now";
import { ADMIN_CARD_CLASS, ADMIN_TABLE_HEADER_CLASS } from "../admin-styles";
import { AdminHeading, AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { ACCOUNT_GRID_CLASS, AccountRow } from "./account-row";
import { AccountsEmpty, AccountsSkeleton } from "./accounts-states";
import { AccountsToolbar } from "./accounts-toolbar";

const text = backofficeFr.accounts;

const SEARCH_DELAY_MS = 300;

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
  const accounts = useAccounts(filter, debouncedSearch);
  const { refetch, fetchNextPage } = accounts;
  const retry = useCallback(() => void refetch(), [refetch]);
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const clearSearch = useCallback(() => onSearchChange(""), [onSearchChange]);
  const showAll = useCallback(() => onFilterChange("all"), [onFilterChange]);
  const rows = useMemo(
    () => accounts.data?.pages.flatMap((page) => page.accounts) ?? [],
    [accounts.data],
  );
  const counts = accounts.data?.pages[0]?.counts ?? null;
  const total = counts === null ? 0 : counts[filter];
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
        <div className="flex flex-col gap-3">
          <div className={ADMIN_CARD_CLASS}>
            <AccountsHeader />
            <ul>
              {rows.map((account) => (
                <AccountRow key={account.id} account={account} now={now} />
              ))}
            </ul>
          </div>
          {accounts.hasNextPage ? (
            <p className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
              {text.shown(rows.length, total)} ·
              <Button
                variant="link"
                className="h-12 px-0 text-[13px] font-semibold text-[#0E7C5A] lg:h-auto"
                disabled={accounts.isFetchingNextPage}
                onClick={loadMore}
              >
                {text.loadMore}
              </Button>
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminPage>
  );
};
