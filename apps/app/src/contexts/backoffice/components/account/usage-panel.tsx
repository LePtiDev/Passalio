import type { AccountUsageResponse } from "@passalio/shared";
import { TrendingDown } from "lucide-react";
import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/contexts/identity";
import { cn } from "@/lib/utils";
import { backofficeFr } from "../../fr";
import { useAccountUsage } from "../../hooks/use-backoffice-queries";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_TABLE_HEADER_CLASS,
} from "../admin-styles";
import { MonthAxis, MonthlyBars } from "../usage/monthly-bars";
import { TrendBadge } from "../usage/trend-badge";

const text = backofficeFr.usagePanel;

const GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_56px_56px_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_110px] lg:gap-4";

const MAIN_DECLINERS = 2;

const DroppingBanner = ({ usage }: { readonly usage: AccountUsageResponse }) => {
  const decliners = usage.people
    .filter(({ trend }) => trend.recent < trend.previous)
    .toSorted(
      (first, second) =>
        first.trend.recent - first.trend.previous - (second.trend.recent - second.trend.previous),
    )
    .slice(0, MAIN_DECLINERS)
    .map(({ name }) => name);
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-[#F7D9A8] bg-[#FFFBF2] p-4 lg:rounded-xl">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FEF3E2] text-[#B45309]">
        <TrendingDown aria-hidden="true" className="size-4" />
      </span>
      <span className="flex flex-col gap-0.5 text-[13px]">
        <strong className="font-bold text-[#B45309]">
          {text.droppingTitle(Math.abs(usage.trend.changePercent ?? 0))}
        </strong>
        <span className="text-[#334155]">
          {text.droppingText(usage.trend.recent, usage.trend.previous)}
          {decliners.length === 0 ? "" : text.mainDecliners(decliners)}
        </span>
      </span>
    </div>
  );
};

const SKELETON_BAR_CLASSES = ["h-[60%]", "h-[80%]", "h-[90%]", "h-full", "h-[95%]", "h-[55%]"];

const UsageSkeleton = () => (
  <div className="flex flex-col gap-4" aria-busy="true">
    <div className={cn(ADMIN_CARD_CLASS, "flex flex-col gap-4 p-4")}>
      <Skeleton className="h-4 w-32" />
      <div className="grid h-[180px] grid-cols-6 items-end gap-3">
        {SKELETON_BAR_CLASSES.map((heightClass) => (
          <Skeleton key={heightClass} className={cn("w-full", heightClass)} />
        ))}
      </div>
    </div>
    <Skeleton className="h-40 w-full rounded-xl" />
  </div>
);

export const UsagePanel = ({ accountId }: { readonly accountId: string }) => {
  const usage = useAccountUsage(accountId);
  const { refetch } = usage;
  const retry = useCallback(() => void refetch(), [refetch]);
  if (usage.isPending) {
    return <UsageSkeleton />;
  }
  if (usage.isError) {
    return <ErrorState error={usage.error} onRetry={retry} />;
  }
  const data = usage.data;
  return (
    <div className="flex flex-col gap-4">
      {data.trend.isDropping ? <DroppingBanner usage={data} /> : null}
      <section
        className={cn(ADMIN_CARD_CLASS, "flex flex-col gap-3 p-4")}
        aria-labelledby="usage-chart-title"
      >
        <span className="flex flex-wrap items-baseline gap-x-2.5">
          <h2 id="usage-chart-title" className={ADMIN_CARD_TITLE_CLASS}>
            {text.chartTitle}
          </h2>
          <span className="text-[13px] text-[#64748B]">{text.chartSubtitle}</span>
        </span>
        <div>
          <MonthlyBars
            months={data.months}
            label={text.chartLabel}
            unit={text.chartTitle.toLowerCase()}
          />
          <MonthAxis months={data.months} />
        </div>
        <p className="text-xs text-[#64748B]">
          {text.definition} <span className="text-[#F59E0B]">■</span> {text.currentMonth}
        </p>
      </section>
      <section className={ADMIN_CARD_CLASS} aria-labelledby="usage-people-title">
        <div className={ADMIN_CARD_HEADER_CLASS}>
          <span className="flex flex-wrap items-baseline gap-x-2.5">
            <h2 id="usage-people-title" className={ADMIN_CARD_TITLE_CLASS}>
              {text.peopleTitle}
            </h2>
            <span className="hidden text-[13px] text-[#64748B] lg:inline">
              {text.peopleSubtitle}
            </span>
          </span>
        </div>
        {data.people.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[#64748B]">{text.empty}</p>
        ) : (
          <>
            <div aria-hidden="true" className={cn(GRID_CLASS, ADMIN_TABLE_HEADER_CLASS)}>
              <span>{text.columns.person}</span>
              <span className="text-right">{text.columns.previous}</span>
              <span className="text-right">{text.columns.recent}</span>
              <span className="text-right">{text.columns.change}</span>
            </div>
            <ul>
              {data.people.map((person) => (
                <li
                  key={person.userId}
                  className={cn(
                    GRID_CLASS,
                    "min-h-12 border-b border-[#EEF2F6] px-4 py-2.5 text-[13px] last:border-b-0",
                  )}
                >
                  <span className="flex min-w-0 flex-col lg:block lg:truncate">
                    <strong className="truncate font-semibold">{person.name}</strong>
                    <span className="truncate text-xs text-[#64748B] lg:text-[13px]">
                      <span className="hidden lg:inline"> · </span>
                      {ROLE_LABELS[person.role]}
                    </span>
                  </span>
                  <span className="text-right text-[#475569] tabular-nums">
                    {person.trend.previous}
                  </span>
                  <span className="text-right font-bold tabular-nums">{person.trend.recent}</span>
                  <span className="flex justify-end">
                    <TrendBadge trend={person.trend} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};
