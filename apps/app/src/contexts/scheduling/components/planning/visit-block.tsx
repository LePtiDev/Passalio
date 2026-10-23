import { Check, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { timeLabelOf } from "../../planning-layout";
import type { PlanningVisit } from "../../planning-visits";
import type { TechnicianColor } from "../../technician-colors";

export type VisitBlockSize = "large" | "small";

type VisitBlockProps = {
  readonly visit: PlanningVisit;
  readonly color: TechnicianColor;
  readonly size: VisitBlockSize;
  readonly height: number;
  readonly isSelected: boolean;
  readonly showCity: boolean;
  readonly useShortName: boolean;
};

const ONE_LINE_HEIGHT = { large: 40, small: 34 } as const;

export const visitTimeRange = (visit: PlanningVisit) =>
  visit.startMinutes === null
    ? null
    : schedulingFr.planning.timeRange(
        timeLabelOf(visit.startMinutes),
        timeLabelOf(visit.startMinutes + visit.durationMinutes),
      );

export const VisitBlockContent = ({
  visit,
  color,
  size,
  height,
  isSelected,
  showCity,
  useShortName,
}: VisitBlockProps) => {
  const isOneLine = height < ONE_LINE_HEIGHT[size];
  const name = useShortName ? visit.shortName : visit.customerName;
  const range = visitTimeRange(visit);
  const city = visit.site?.city ?? null;
  return (
    <span
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-md border-l-[3px] pr-1.5 pl-2 text-left",
        isOneLine ? "py-[3px]" : "py-1.5",
        isSelected && "shadow-[0_2px_8px_rgba(15,42,68,0.18)]",
        visit.isDone && "opacity-55",
      )}
      style={color.blockStyle}
    >
      <span className="flex items-start gap-1">
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-semibold",
            size === "small" ? "text-xs" : "text-[13px] lg:text-xs",
          )}
        >
          {name}
          {isOneLine && visit.startMinutes !== null ? (
            <span className="font-normal opacity-75"> {timeLabelOf(visit.startMinutes)}</span>
          ) : null}
        </span>
        {visit.isPending ? (
          <CloudOff aria-label={schedulingFr.planning.toSend} className="mt-px size-3.5 shrink-0" />
        ) : null}
        {visit.isDone ? (
          <Check aria-label={schedulingFr.planning.signed} className="mt-px size-3.5 shrink-0" />
        ) : null}
      </span>
      {isOneLine || range === null ? null : (
        <span
          className={cn(
            "block truncate opacity-75",
            size === "small" ? "text-[11px]" : "text-xs lg:text-[11px]",
          )}
        >
          {range}
          {showCity && city !== null ? ` · ${city}` : null}
        </span>
      )}
    </span>
  );
};
