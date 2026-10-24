import { CalendarDays, CloudOff, Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import type { HourRange } from "../../planning-layout";
import { NewVisitLink } from "./new-visit-link";
import { HourGutter, HourLines } from "./time-grid";

const text = schedulingFr.planning;

const SKELETON_SLOTS: readonly (readonly [number, number])[] = [
  [0.5, 1],
  [2, 1],
  [3.5, 0.75],
  [6, 1.5],
  [8, 1],
];

const SkeletonSlot = ({
  start,
  duration,
  hourHeight,
}: {
  readonly start: number;
  readonly duration: number;
  readonly hourHeight: number;
}) => {
  const style = useMemo(
    () => ({ top: start * hourHeight + 1, height: duration * hourHeight - 2 }),
    [start, duration, hourHeight],
  );
  return <Skeleton className="absolute inset-x-[3px] rounded-md bg-[#EEF2F6]" style={style} />;
};

export const GridSkeleton = ({
  range,
  hourHeight,
  gutterClassName,
  isBordered,
}: {
  readonly range: HourRange;
  readonly hourHeight: number;
  readonly gutterClassName: string;
  readonly isBordered: boolean;
}) => {
  const height = (range.lastHour - range.firstHour) * hourHeight;
  const columnStyle = useMemo(() => ({ height }), [height]);
  return (
    <div aria-busy="true" aria-label={text.loadingLabel} className="flex">
      <HourGutter range={range} hourHeight={hourHeight} className={gutterClassName} />
      <div className={cn("flex min-w-0 flex-1", isBordered && "border-r border-[#F0F3F6]")}>
        <div
          className={cn("relative min-w-0 flex-1", isBordered && "border-l border-[#F0F3F6]")}
          style={columnStyle}
        >
          <HourLines range={range} hourHeight={hourHeight} />
          {SKELETON_SLOTS.map(([start, duration]) => (
            <SkeletonSlot key={start} start={start} duration={duration} hourHeight={hourHeight} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const EmptyPlanning = ({
  title,
  canPlan,
  day,
  isInline = false,
}: {
  readonly title: string;
  readonly canPlan: boolean;
  readonly day: string;
  readonly isInline?: boolean;
}) => (
  <div
    className={cn(
      "flex justify-center px-4",
      isInline
        ? "border-b border-[#EEF2F6] bg-white py-4"
        : "pointer-events-none absolute inset-x-0 top-16 z-30",
    )}
  >
    <div className="pointer-events-auto flex max-w-[340px] flex-col items-center gap-2 rounded-xl border border-[#E3E8EF] bg-white px-5 py-5 text-center shadow-[0_8px_24px_rgba(15,42,68,0.08)]">
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-[#E6F4EE] text-[#0E7C5A]"
      >
        <CalendarDays className="size-5" />
      </span>
      <h2 className="text-[15px] font-bold lg:text-sm">{title}</h2>
      <p className="text-[13px] text-[#475569]">
        {canPlan ? text.emptyText : text.emptyTechnicianText}
      </p>
      {canPlan ? (
        <Button asChild className="mt-1 w-full lg:w-auto">
          <NewVisitLink day={day}>
            <Plus aria-hidden="true" className="size-4 lg:size-3.5" />
            {text.newVisit}
          </NewVisitLink>
        </Button>
      ) : null}
    </div>
  </div>
);

export const OfflineBar = ({ pendingCount }: { readonly pendingCount: number }) => (
  <output className="flex items-center gap-2.5 border-b border-[#F5D9B0] bg-[#FFFAF2] px-4 py-2.5 text-[13px] text-[#B45309] lg:px-6">
    <CloudOff aria-hidden="true" className="size-4 shrink-0" />
    <span>
      <b className="font-semibold">{text.offline}</b> {text.offlineText(pendingCount)}
    </span>
  </output>
);

export const SummarySkeleton = () => (
  <div className="flex items-center justify-between border-b border-[#EEF2F6] bg-white px-4 py-3 lg:hidden">
    <Skeleton className="h-3 w-28" />
    <Skeleton className="h-3 w-24" />
  </div>
);
