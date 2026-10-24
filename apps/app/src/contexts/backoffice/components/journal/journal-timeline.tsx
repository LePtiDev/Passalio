import type { JournalEntryResponse } from "@passalio/shared";
import { useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ErrorState } from "@/components/error-state";
import { CursorPagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/lib/use-paged-list";
import { dayKeyOf, journalDayLabel, timeOf } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import { useJournalPage } from "../../hooks/use-backoffice-queries";
import { useNow } from "../../hooks/use-now";
import { ADMIN_CARD_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "../admin-styles";
import { JournalSentence } from "./journal-sentence";

const text = backofficeFr.journal;

const JOURNAL_ROW_HEIGHTS = { mobile: 105, desktop: 62 } as const;

type JournalDay = { readonly day: string; readonly entries: readonly JournalEntryResponse[] };

const groupByDay = (entries: readonly JournalEntryResponse[]) =>
  entries.reduce<JournalDay[]>((days, entry) => {
    const day = dayKeyOf(new Date(entry.createdAt));
    const last = days.at(-1);
    if (last !== undefined && last.day === day) {
      return [...days.slice(0, -1), { day, entries: [...last.entries, entry] }];
    }
    return [...days, { day, entries: [entry] }];
  }, []);

const dotClass = (entry: JournalEntryResponse) =>
  entry.action.startsWith("platform.") ? "bg-[#0F2A44]" : "bg-[#0E7C5A]";

const JournalSkeleton = () => (
  <div className="flex flex-col gap-2" aria-busy="true">
    <Skeleton className="h-3 w-48" />
    <div className={ADMIN_CARD_CLASS}>
      {["a", "b", "c"].map((key) => (
        <div
          key={key}
          className="flex items-center gap-4 border-b border-[#EEF2F6] px-4 py-3.5 last:border-b-0"
        >
          <Skeleton className="h-3 w-10" />
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
      ))}
    </div>
  </div>
);

type JournalTimelineProps = {
  readonly accountId: string | null;
};

export const JournalTimeline = ({ accountId }: JournalTimelineProps) => {
  const { measureList, ...paging } = usePagedList(accountId ?? "all", JOURNAL_ROW_HEIGHTS);
  const journal = useJournalPage(accountId, paging.cursor, paging.pageSize);
  const { refetch } = journal;
  const now = useNow();
  const retry = useCallback(() => void refetch(), [refetch]);
  const entries = journal.data?.entries ?? [];
  const days = useMemo(() => groupByDay(journal.data?.entries ?? []), [journal.data]);
  return (
    <div ref={measureList} className="flex flex-col gap-5">
      {journal.isPending ? <JournalSkeleton /> : null}
      {journal.isError ? <ErrorState error={journal.error} onRetry={retry} /> : null}
      {journal.isSuccess && days.length === 0 ? <JournalEmpty /> : null}
      {days.map(({ day, entries: dayEntries }) => (
        <JournalDaySection
          key={day}
          day={day}
          entries={dayEntries}
          now={now}
          isOrganizationShown={accountId === null}
        />
      ))}
      {entries.length > 0 ? (
        <div className={ADMIN_CARD_CLASS}>
          <CursorPagination
            paging={paging}
            nextCursor={journal.data?.nextCursor ?? null}
            shown={entries.length}
            total={null}
            isLoading={journal.isPlaceholderData}
          />
        </div>
      ) : null}
    </div>
  );
};

const JournalEmpty = () => (
  <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[#D5DDE6] bg-white px-6 py-8 text-center lg:rounded-xl">
    <p className="text-[15px] font-bold">{text.empty}</p>
    <p className="max-w-md text-[13px] text-[#475569]">{text.emptyText}</p>
    <Link
      to="/admin/comptes"
      className={cn(buttonVariants({ variant: "outline" }), ADMIN_SECONDARY_BUTTON_CLASS, "mt-2")}
    >
      {text.emptyAction}
    </Link>
  </div>
);

type JournalDaySectionProps = {
  readonly day: string;
  readonly entries: readonly JournalEntryResponse[];
  readonly now: Date;
  readonly isOrganizationShown: boolean;
};

const JournalDaySection = ({ day, entries, now, isOrganizationShown }: JournalDaySectionProps) => (
  <section className="flex flex-col gap-2" aria-label={journalDayLabel(day, now)}>
    <h2 className="px-1 text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
      {journalDayLabel(day, now)}
    </h2>
    <ul className={ADMIN_CARD_CLASS}>
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-col gap-1 border-b border-[#EEF2F6] px-4 py-3 text-[15px] last:border-b-0 lg:flex-row lg:items-baseline lg:gap-4 lg:text-[13px]"
        >
          <span className="order-2 text-xs text-[#64748B] tabular-nums lg:order-none lg:w-11 lg:text-[13px]">
            {timeOf(entry.createdAt)}
          </span>
          <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${dotClass(entry)}`}
            />
            <JournalSentence entry={entry} isOrganizationShown={isOrganizationShown} />
          </span>
        </li>
      ))}
    </ul>
  </section>
);
