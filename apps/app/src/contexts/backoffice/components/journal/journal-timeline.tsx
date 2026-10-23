import type { JournalEntryResponse } from "@passalio/shared";
import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dayKeyOf, journalDayLabel, timeOf } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import { useJournal } from "../../hooks/use-backoffice-queries";
import { useNow } from "../../hooks/use-now";
import { ADMIN_CARD_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "../admin-styles";
import { JournalSentence } from "./journal-sentence";

const text = backofficeFr.journal;

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
  const journal = useJournal(accountId);
  const { refetch, fetchNextPage } = journal;
  const now = useNow();
  const retry = useCallback(() => void refetch(), [refetch]);
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const days = useMemo(
    () => groupByDay(journal.data?.pages.flatMap((page) => page.entries) ?? []),
    [journal.data],
  );
  if (journal.isPending) {
    return <JournalSkeleton />;
  }
  if (journal.isError) {
    return <ErrorState error={journal.error} onRetry={retry} />;
  }
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[#D5DDE6] bg-white px-6 py-8 text-center lg:rounded-xl">
        <p className="text-[15px] font-bold">{text.empty}</p>
        <p className="max-w-md text-[13px] text-[#475569]">{text.emptyText}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {days.map(({ day, entries }) => (
        <section key={day} className="flex flex-col gap-2" aria-label={journalDayLabel(day, now)}>
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
                  <JournalSentence entry={entry} isOrganizationShown={accountId === null} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {journal.hasNextPage ? (
        <Button
          variant="outline"
          className={`${ADMIN_SECONDARY_BUTTON_CLASS} self-start`}
          disabled={journal.isFetchingNextPage}
          onClick={loadMore}
        >
          {text.loadMore}
        </Button>
      ) : null}
    </div>
  );
};
