import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalSession } from "@/lib/db/local-database-context";
import { runSync } from "@/lib/sync/sync-scheduler";
import { useFittingRows } from "@/lib/use-fitting-rows";
import { usePageNumber } from "@/lib/use-page-number";
import { customersFr } from "../../fr";
import { useCustomerList, type CustomerFilter } from "../../hooks/use-customer-list";
import { useSyncIndicator } from "../../hooks/use-sync-indicator";
import { CARD_CLASS, PRIMARY_BUTTON_CLASS } from "../customer-styles";
import { MobileSyncLine, OfflineBanner, SyncPill } from "../sync-indicator";
import { CustomerListToolbar } from "./customer-list-toolbar";
import {
  CustomerFilterEmpty,
  CustomerListEmpty,
  CustomerListError,
  CustomerListSkeleton,
  CustomerSearchEmpty,
} from "./customer-list-states";
import { CustomerListHeader, CustomerRow } from "./customer-row";

const text = customersFr.list;

const CUSTOMER_ROW_HEIGHTS = { mobile: 73, desktop: 61 } as const;

const TRAIL = [{ label: text.title }];

type ListState = NonNullable<ReturnType<typeof useCustomerList>>;

const subtitleOf = (list: ListState | undefined, hasFailed: boolean) => {
  if (hasFailed) {
    return text.errorSubtitle;
  }
  return list === undefined || list.customerCount === 0
    ? text.emptySubtitle
    : text.subtitle(list.customerCount, list.equipmentCount);
};

const ListBody = ({
  list,
  query,
  filter,
  pageSize,
  onClear,
  onShowAll,
}: {
  readonly list: ListState;
  readonly query: string;
  readonly filter: CustomerFilter;
  readonly pageSize: number;
  readonly onClear: () => void;
  readonly onShowAll: () => void;
}) => {
  const pages = usePageNumber(`${query}:${pageSize}`);
  const lastPage = Math.max(0, Math.ceil(list.rows.length / pageSize) - 1);
  const page = Math.min(pages.page, lastPage);
  if (list.customerCount === 0) {
    return <CustomerListEmpty />;
  }
  if (list.rows.length === 0 && query.trim() !== "") {
    return <CustomerSearchEmpty query={query.trim()} onClear={onClear} />;
  }
  if (list.rows.length === 0 && filter !== "all") {
    return <CustomerFilterEmpty filter={filter} onShowAll={onShowAll} />;
  }
  const visible = list.rows.slice(page * pageSize, (page + 1) * pageSize);
  return (
    <div className={CARD_CLASS}>
      <CustomerListHeader />
      <ul>
        {visible.map((row) => (
          <CustomerRow key={row.customer.id} row={row} />
        ))}
      </ul>
      <Pagination
        page={page}
        pageSize={pageSize}
        shown={visible.length}
        total={list.rows.length}
        hasNext={(page + 1) * pageSize < list.rows.length}
        isLoading={false}
        onPrevious={pages.goPrevious}
        onNext={pages.goNext}
      />
    </div>
  );
};

export const CustomerListScreen = () => {
  const { database } = useLocalSession();
  const sync = useSyncIndicator();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const { measureList, pageSize } = useFittingRows(CUSTOMER_ROW_HEIGHTS);
  const list = useCustomerList(query, filter);
  const clear = useCallback(() => setQuery(""), []);
  const showAll = useCallback(() => setFilter("all"), []);
  const retry = useCallback(() => {
    void runSync(database);
  }, [database]);

  const isWaitingForFirstSync =
    list !== undefined && list.customerCount === 0 && sync.lastSyncedAt === null && sync.isLoaded;
  const hasFailed = isWaitingForFirstSync && (sync.phase === "error" || sync.isOffline);
  const isLoading = list === undefined || !sync.isLoaded || (isWaitingForFirstSync && !hasFailed);
  const subtitle = subtitleOf(list, hasFailed);
  const isEmpty = !isLoading && !hasFailed && list?.customerCount === 0;

  return (
    <>
      <DesktopTopBar trail={TRAIL}>
        <SyncPill />
      </DesktopTopBar>
      <MobileTopBar>
        <span className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-[17px] font-bold">{text.title}</h1>
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0E7C5A]" />
              {text.loading}
            </span>
          ) : (
            <MobileSyncLine
              prefix={hasFailed ? undefined : text.customerCount(list?.customerCount ?? 0)}
            />
          )}
        </span>
        <Link
          to="/clients/nouveau"
          aria-label={text.newCustomer}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
        >
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
        </Link>
      </MobileTopBar>
      <PageContent>
        <div className="hidden flex-wrap items-end justify-between gap-4 lg:flex">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-[-0.015em]">{text.title}</h1>
            {isLoading ? (
              <Skeleton className="mt-1 h-3.5 w-72" />
            ) : (
              <p className="text-[13px] text-[#475569]">{subtitle}</p>
            )}
          </div>
          <Button asChild className={PRIMARY_BUTTON_CLASS}>
            <Link to="/clients/nouveau">
              <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
              {text.newCustomer}
            </Link>
          </Button>
        </div>
        {sync.isOffline && !hasFailed ? (
          <OfflineBanner
            title={customersFr.sync.offlineTitle}
            text={customersFr.sync.offlineText(sync.pendingCount)}
          />
        ) : null}
        {isEmpty ? null : (
          <CustomerListToolbar
            query={query}
            filter={filter}
            counts={isLoading || hasFailed || list === undefined ? null : list.counts}
            onQueryChange={setQuery}
            onFilterChange={setFilter}
          />
        )}
        <div ref={measureList} className="flex flex-col gap-4 lg:gap-5">
          {hasFailed ? <CustomerListError error={sync.error} onRetry={retry} /> : null}
          {isLoading || pageSize === null ? <CustomerListSkeleton /> : null}
          {!isLoading && !hasFailed && list !== undefined && pageSize !== null ? (
            <ListBody
              key={filter}
              list={list}
              query={query}
              filter={filter}
              pageSize={pageSize}
              onClear={clear}
              onShowAll={showAll}
            />
          ) : null}
        </div>
      </PageContent>
    </>
  );
};
