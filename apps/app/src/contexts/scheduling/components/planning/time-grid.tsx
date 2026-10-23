import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import {
  fitLanes,
  isWithin,
  offsetOf,
  placeSlots,
  type HourRange,
  type TimedSlot,
} from "../../planning-layout";
import type { PlanningVisit } from "../../planning-visits";
import type { TechnicianColor } from "../../technician-colors";
import { VisitBlockContent, visitTimeRange, type VisitBlockSize } from "./visit-block";
import { VisitLink, type VisitLinkMode } from "./visit-link";

export type GridColumn = {
  readonly key: string;
  readonly day: string;
  readonly visits: readonly PlanningVisit[];
  readonly colorOf: (visit: PlanningVisit) => TechnicianColor;
  readonly isMuted: boolean;
  readonly hasNow: boolean;
};

type TimeGridProps = {
  readonly columns: readonly GridColumn[];
  readonly range: HourRange;
  readonly hourHeight: number;
  readonly nowMinutes: number | null;
  readonly size: VisitBlockSize;
  readonly showCity: boolean;
  readonly useShortName: boolean;
  readonly selectedId: string | undefined;
  readonly linkMode: VisitLinkMode;
  readonly gutterClassName: string;
  readonly isBordered: boolean;
  readonly maxLanes: number;
  readonly label: string;
};

type TimedVisit = TimedSlot & { readonly visit: PlanningVisit };

const timedVisitsOf = (visits: readonly PlanningVisit[]): TimedVisit[] =>
  visits.flatMap((visit) =>
    visit.startMinutes === null
      ? []
      : [
          {
            id: visit.id,
            startMinutes: visit.startMinutes,
            durationMinutes: visit.durationMinutes,
            visit,
          },
        ],
  );

const hoursOf = (range: HourRange) =>
  Array.from({ length: range.lastHour - range.firstHour }, (_, index) => range.firstHour + index);

const Positioned = ({
  top,
  className,
  children,
}: {
  readonly top: number;
  readonly className: string;
  readonly children?: ReactNode;
}) => {
  const style = useMemo(() => ({ top }), [top]);
  return (
    <span aria-hidden="true" className={className} style={style}>
      {children}
    </span>
  );
};

export const HourGutter = ({
  range,
  hourHeight,
  className,
}: {
  readonly range: HourRange;
  readonly hourHeight: number;
  readonly className: string;
}) => (
  <div aria-hidden="true" className={cn("relative shrink-0", className)}>
    {hoursOf(range).map((hour, index) =>
      index === 0 ? null : (
        <Positioned
          key={hour}
          top={index * hourHeight}
          className="absolute right-2 -translate-y-1/2 text-[11px] text-[#94A3B8] tabular-nums"
        >
          {schedulingFr.planning.hour(hour)}
        </Positioned>
      ),
    )}
  </div>
);

export const HourLines = ({
  range,
  hourHeight,
}: {
  readonly range: HourRange;
  readonly hourHeight: number;
}) =>
  hoursOf(range).map((hour, index) => (
    <Positioned
      key={hour}
      top={index * hourHeight}
      className="absolute inset-x-0 border-t border-[#F0F3F6]"
    />
  ));

const laneStyleOf = (lane: number, laneCount: number) => ({
  left: `calc(${(lane / laneCount) * 100}% + 3px)`,
  width: `calc(${100 / laneCount}% - 6px)`,
});

const PlacedVisit = ({
  visit,
  startMinutes,
  lane,
  laneCount,
  column,
  props,
}: {
  readonly visit: PlanningVisit;
  readonly startMinutes: number;
  readonly lane: number;
  readonly laneCount: number;
  readonly column: GridColumn;
  readonly props: TimeGridProps;
}) => {
  const { range, hourHeight } = props;
  const top = offsetOf(startMinutes, range, hourHeight) + 1;
  const height = (visit.durationMinutes / 60) * hourHeight - 2;
  const style = useMemo(
    () => ({ top, height, ...laneStyleOf(lane, laneCount) }),
    [top, height, lane, laneCount],
  );
  return (
    <li className="absolute z-20" style={style}>
      <VisitLink
        visitId={visit.id}
        mode={props.linkMode}
        label={[visit.customerName, visitTimeRange(visit)]
          .filter((part) => part !== null)
          .join(", ")}
        className="block size-full rounded-md focus-visible:ring-2 focus-visible:ring-[#0F2A44] focus-visible:outline-none"
      >
        <VisitBlockContent
          visit={visit}
          color={column.colorOf(visit)}
          size={props.size}
          height={height}
          isSelected={props.selectedId === visit.id}
          showCity={props.showCity}
          useShortName={props.useShortName}
        />
      </VisitLink>
    </li>
  );
};

const MoreChip = ({
  day,
  hiddenCount,
  top,
  maxLanes,
}: {
  readonly day: string;
  readonly hiddenCount: number;
  readonly top: number;
  readonly maxLanes: number;
}) => {
  const style = useMemo(() => ({ top, ...laneStyleOf(maxLanes - 1, maxLanes) }), [top, maxLanes]);
  const search = useCallback(
    (previous: Record<string, unknown>) => ({
      ...previous,
      jour: day,
      vue: "jour" as const,
      passage: undefined,
    }),
    [day],
  );
  return (
    <li className="absolute z-20" style={style}>
      <Link
        from="/planning"
        to="/planning"
        search={search}
        aria-label={schedulingFr.planning.moreVisits(hiddenCount)}
        className="flex h-7 items-center justify-center rounded-md bg-[#EEF2F6] text-xs font-semibold text-[#0F2A44] hover:bg-[#E3E8EF]"
      >
        {schedulingFr.planning.more(hiddenCount)}
      </Link>
    </li>
  );
};

const Column = ({
  column,
  props,
}: {
  readonly column: GridColumn;
  readonly props: TimeGridProps;
}) => {
  const { range, hourHeight, nowMinutes } = props;
  const { visible, crowded, maxLanes } = fitLanes(
    placeSlots(timedVisitsOf(column.visits)),
    props.maxLanes,
  );
  const height = (range.lastHour - range.firstHour) * hourHeight;
  const style = useMemo(() => ({ height }), [height]);
  return (
    <div
      className={cn(
        "relative min-w-0 flex-1",
        props.isBordered && "border-l border-[#F0F3F6]",
        column.isMuted && "bg-[#FAFBFC]",
      )}
      style={style}
    >
      <HourLines range={range} hourHeight={hourHeight} />
      {column.hasNow && nowMinutes !== null && isWithin(nowMinutes, range) ? (
        <Positioned
          top={offsetOf(nowMinutes, range, hourHeight)}
          className="pointer-events-none absolute inset-x-0 z-30 h-0 border-t-2 border-[#D92D20]"
        />
      ) : null}
      <ul>
        {visible.map(({ slot, lane, laneCount }) => (
          <PlacedVisit
            key={slot.id}
            visit={slot.visit}
            startMinutes={slot.startMinutes}
            lane={lane}
            laneCount={laneCount}
            column={column}
            props={props}
          />
        ))}
        {crowded.map(({ cluster, hidden, startMinutes }) => (
          <MoreChip
            key={`more-${cluster}`}
            day={column.day}
            hiddenCount={hidden.length}
            top={offsetOf(startMinutes, range, hourHeight) + 1}
            maxLanes={maxLanes}
          />
        ))}
      </ul>
    </div>
  );
};

export const TimeGrid = (props: TimeGridProps) => (
  <section aria-label={props.label} className="flex">
    <HourGutter
      range={props.range}
      hourHeight={props.hourHeight}
      className={props.gutterClassName}
    />
    <div className={cn("flex min-w-0 flex-1", props.isBordered && "border-r border-[#F0F3F6]")}>
      {props.columns.map((column) => (
        <Column key={column.key} column={column} props={props} />
      ))}
    </div>
  </section>
);
