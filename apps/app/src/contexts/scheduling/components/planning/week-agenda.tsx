import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { dayNumberOf, longDayLabel, weekdayShortLabel } from "../../planning-dates";
import type { PlanningVisit } from "../../planning-visits";
import type { TechnicianColor } from "../../technician-colors";
import { visitTimeRange } from "./visit-block";
import { VisitLink } from "./visit-link";

export const WeekAgenda = ({
  days,
  today,
  visitsOn,
  colorOf,
}: {
  readonly days: readonly string[];
  readonly today: string;
  readonly visitsOn: (day: string) => readonly PlanningVisit[];
  readonly colorOf: (visit: PlanningVisit) => TechnicianColor;
}) => (
  <ul className="flex flex-col bg-white pb-20 lg:hidden">
    {days.map((day) => {
      const visits = visitsOn(day);
      const isToday = day === today;
      return (
        <li
          key={day}
          aria-label={longDayLabel(day)}
          className="flex gap-3 border-b border-[#EEF2F6] px-4 py-3"
        >
          <span aria-hidden="true" className="flex w-10 shrink-0 flex-col items-center gap-0.5">
            <span
              className={cn(
                "text-[11px] font-semibold",
                isToday ? "text-[#0F2A44]" : "text-[#94A3B8]",
              )}
            >
              {weekdayShortLabel(day).slice(0, 3)}
            </span>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-[17px] font-semibold tabular-nums",
                isToday && "bg-[#0F2A44] text-white",
              )}
            >
              {dayNumberOf(day)}
            </span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
            {visits.length === 0 ? (
              <span className="flex min-h-12 items-center text-[15px] text-[#94A3B8]">
                {schedulingFr.planning.noVisit}
              </span>
            ) : (
              visits.map((visit) => {
                const color = colorOf(visit);
                const range = visitTimeRange(visit) ?? schedulingFr.planning.untimed;
                return (
                  <VisitLink
                    key={visit.id}
                    visitId={visit.id}
                    mode="open"
                    label={`${visit.customerName}, ${range}`}
                    className={cn(
                      "flex min-h-12 flex-col justify-center rounded-lg border-l-[3px] px-3 py-1.5",
                      visit.isDone && "opacity-55",
                    )}
                    style={color.blockStyle}
                  >
                    <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                      <span className="truncate">{visit.shortName}</span>
                      {visit.isDone ? (
                        <Check aria-hidden="true" className="size-4 shrink-0" />
                      ) : null}
                    </span>
                    <span className="truncate text-[13px] opacity-75">
                      {[range, visit.site?.city ?? null]
                        .filter((part) => part !== null)
                        .join(" · ")}
                    </span>
                  </VisitLink>
                );
              })
            )}
          </span>
        </li>
      );
    })}
  </ul>
);
