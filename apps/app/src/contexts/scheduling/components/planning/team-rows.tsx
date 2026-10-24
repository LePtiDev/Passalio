import { Link } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { initialsOf } from "@/lib/initials";
import { schedulingFr } from "../../fr";
import { DEFAULT_FIRST_HOUR, DEFAULT_LAST_HOUR, timeLabelOf } from "../../planning-layout";
import { nextVisitOf, type NextVisit, type PlanningVisit } from "../../planning-visits";
import type { Technician } from "../../technicians";

const text = schedulingFr.team;

const SPAN_MINUTES = (DEFAULT_LAST_HOUR - DEFAULT_FIRST_HOUR) * 60;

const percentOf = (minutes: number) =>
  `${Math.max(0, Math.min(100, ((minutes - DEFAULT_FIRST_HOUR * 60) / SPAN_MINUTES) * 100))}%`;

const nextLabel = (next: NextVisit) => {
  switch (next.kind) {
    case "none":
      return text.noVisit;
    case "finished":
      return text.finished;
    default: {
      const { visit } = next;
      const when =
        next.kind === "now"
          ? text.current
          : visit.startMinutes === null
            ? null
            : timeLabelOf(visit.startMinutes);
      return [when, visit.shortName, visit.site?.city ?? null]
        .filter((part) => part !== null && part !== "")
        .join(" · ");
    }
  }
};

const TimelineSegment = ({
  startMinutes,
  durationMinutes,
  color,
  isDone,
}: {
  readonly startMinutes: number;
  readonly durationMinutes: number;
  readonly color: string;
  readonly isDone: boolean;
}) => {
  const style = useMemo(
    () => ({
      left: percentOf(startMinutes),
      width: `${(durationMinutes / SPAN_MINUTES) * 100}%`,
      background: color,
      opacity: isDone ? 0.4 : 1,
    }),
    [startMinutes, durationMinutes, color, isDone],
  );
  return <span className="absolute inset-y-0 rounded-full" style={style} />;
};

const NowMarker = ({ minutes }: { readonly minutes: number }) => {
  const style = useMemo(() => ({ left: percentOf(minutes) }), [minutes]);
  return <span className="absolute -inset-y-1 w-0.5 bg-[#D92D20]" style={style} />;
};

const Timeline = ({
  visits,
  technician,
  nowMinutes,
}: {
  readonly visits: readonly PlanningVisit[];
  readonly technician: Technician;
  readonly nowMinutes: number | null;
}) => (
  <span aria-hidden="true" className="relative mt-2 block h-1.5 rounded-full bg-[#F0F3F6]">
    {visits.map((visit) =>
      visit.startMinutes === null ? null : (
        <TimelineSegment
          key={visit.id}
          startMinutes={visit.startMinutes}
          durationMinutes={visit.durationMinutes}
          color={technician.color.bar}
          isDone={visit.isDone}
        />
      ),
    )}
    {nowMinutes === null ? null : <NowMarker minutes={nowMinutes} />}
  </span>
);

const TeamRow = ({
  technician,
  visits,
  nowMinutes,
}: {
  readonly technician: Technician;
  readonly visits: readonly PlanningVisit[];
  readonly nowMinutes: number | null;
}) => {
  const done = visits.filter(({ isDone }) => isDone).length;
  const search = useCallback(
    (previous: Record<string, unknown>) => ({ ...previous, agendas: technician.userId }),
    [technician.userId],
  );
  return (
    <li className="border-b border-[#EEF2F6]">
      <Link
        from="/planning"
        to="/planning"
        search={search}
        className="flex min-h-[76px] items-center gap-3 px-4 py-3"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
          style={technician.color.avatarStyle}
        >
          {initialsOf(technician.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[15px] font-semibold">{technician.name}</span>
            <span
              aria-label={text.progressLabel(done, visits.length)}
              className="shrink-0 text-[13px] text-[#64748B] tabular-nums"
            >
              {text.progress(done, visits.length)}
            </span>
          </span>
          <span className="block truncate text-[13px] text-[#475569]">
            {nextLabel(nextVisitOf(visits, nowMinutes))}
          </span>
          {visits.length === 0 ? null : (
            <Timeline visits={visits} technician={technician} nowMinutes={nowMinutes} />
          )}
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[#94A3B8]" />
      </Link>
    </li>
  );
};

export const TeamRows = ({
  technicians,
  visitsOf,
  nowMinutes,
}: {
  readonly technicians: readonly Technician[];
  readonly visitsOf: (userId: string) => readonly PlanningVisit[];
  readonly nowMinutes: number | null;
}) => (
  <ul className="flex flex-col bg-white pb-20 lg:hidden">
    {technicians.map((technician) => (
      <TeamRow
        key={technician.userId}
        technician={technician}
        visits={visitsOf(technician.userId)}
        nowMinutes={nowMinutes}
      />
    ))}
  </ul>
);
