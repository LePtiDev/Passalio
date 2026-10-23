import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import type { PlanningVisit } from "../../planning-visits";
import type { TechnicianColor } from "../../technician-colors";
import { VisitLink, type VisitLinkMode } from "./visit-link";

export const UntimedVisits = ({
  visits,
  colorOf,
  mode,
  className,
}: {
  readonly visits: readonly PlanningVisit[];
  readonly colorOf: (visit: PlanningVisit) => TechnicianColor;
  readonly mode: VisitLinkMode;
  readonly className?: string;
}) => {
  const untimed = visits.filter(({ startMinutes }) => startMinutes === null);
  if (untimed.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-[11px] font-semibold text-[#94A3B8] uppercase">
        {schedulingFr.planning.untimed}
      </span>
      {untimed.map((visit) => {
        const color = colorOf(visit);
        return (
          <VisitLink
            key={visit.id}
            visitId={visit.id}
            mode={mode}
            label={visit.customerName}
            className={cn(
              "flex min-h-8 items-center rounded-md border-l-[3px] px-2 text-xs font-semibold",
              visit.isDone && "opacity-55",
            )}
            style={color.blockStyle}
          >
            {visit.shortName}
          </VisitLink>
        );
      })}
    </div>
  );
};
