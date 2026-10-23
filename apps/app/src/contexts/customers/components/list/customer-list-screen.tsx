import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalSession } from "@/lib/db/local-database-context";
import { runSync } from "@/lib/sync/sync-scheduler";
import { cn } from "@/lib/utils";
import { customersFr } from "../../fr";
import { useCustomerList, type CustomerFilter } from "../../hooks/use-customer-list";
import { useSyncIndicator } from "../../hooks/use-sync-indicator";
import { CARD_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "../customer-styles";
import { MobileSyncLine, OfflineBanner, SyncPill } from "../sync-indicator";
import { CustomerListToolbar } from "./customer-list-toolbar";
import {
  CustomerListEmpty,
  CustomerListError,
  CustomerListSkeleton,
  CustomerSearchEmpty,
} from "./customer-list-states";
import { CustomerListHeader, CustomerRow } from "./customer-row";

const text = customersFr.list;

const PAGE_SIZE = 50;

const TRAIL = [{ label: text.title }];

type ListState = NonNullable<ReturnType<typeof useCustomerList>>;

const ListBody = ({
  list,
  query,
  visibleCount,
  onShowMore,
  onClear,
}: {
  readonly list: ListState;
  readonly query: string;
  readonly visibleCount: number;
  readonly onShowMore: () => void;
  readonly onClear: () => void;
}) => {
  if (list.customerCount === 0) {
    return <CustomerListEmpty />;
  }
  if (list.rows.length === 0 && query.trim() !== "") {
    return <CustomerSearchEmpty query={query.trim()} onClear={onClear} />;
  }
  return (
    <>
      <div className={CARD_CLASS}>
        <CustomerListHeader />
        <ul>
          {list.rows.slice(0, visibleCount).map((row) => (
            <CustomerRow key={row.customer.id} row={row} />
          ))}
        </ul>
      </div>
      {list.rows.length > visibleCount ? (
        <Button
          variant="outline"
          className={cn(SECONDARY_BUTTON_CLASS, "lg:self-center")}
          onClick={onShowMore}
        >
          {text.showMore}
        </Button>
      ) : null}
    </>
  );
};

export const CustomerListScreen = () => {
  const { database } = useLocalSession();
  const sync = useSyncIndicator();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const list = useCustomerList(query, filter);
  const clear = useCallback(() => setQuery(""), []);
  const showMore = useCallback(() => setVisibleCount((count) => count + PAGE_SIZE), []);
  const retry = useCallback(() => {
    void runSync(database);
  }, [database]);

  const isWaitingForFirstSync =
    list !== undefined && list.customerCount === 0 && sync.lastSyncedAt === null && sync.isLoaded;
  const hasFailed = isWaitingForFirstSync && (sync.phase === "error" || sync.isOffline);
  const isLoading = list === undefined || !sync.isLoaded || (isWaitingForFirstSync && !hasFailed);
  const subtitle =
    list === undefined || list.customerCount === 0
      ? text.emptySubtitle
      : text.subtitle(list.customerCount, list.equipmentCount);

  return (
    <>
      <DesktopTopBar trail={TRAIL}>
        <SyncPill />
      </DesktopTopBar>
      <MobileTopBar>
        <span className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-[17px] font-bold">{text.title}</h1>
          {isLoading ? (
            <span className="text-[13px] text-[#64748B]">{text.loading}</span>
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
        <CustomerListToolbar
          query={query}
          filter={filter}
          counts={isLoading || hasFailed || list === undefined ? null : list.counts}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
        />
        {hasFailed ? <CustomerListError error={sync.error} onRetry={retry} /> : null}
        {isLoading ? <CustomerListSkeleton /> : null}
        {!isLoading && !hasFailed && list !== undefined ? (
          <ListBody
            list={list}
            query={query}
            visibleCount={visibleCount}
            onShowMore={showMore}
            onClear={clear}
          />
        ) : null}
      </PageContent>
    </>
  );
};
