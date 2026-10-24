import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { dayNumberOf, longDayLabel, weekdayShortLabel } from "../../planning-dates";
import type { Technician } from "../../technicians";

export const WeekDayHeader = ({
  days,
  today,
}: {
  readonly days: readonly string[];
  readonly today: string;
}) => (
  <div className="flex border-b border-[#EEF2F6] pr-6 pl-[72px]">
    {days.map((day) => {
      const isToday = day === today;
      return (
        <div
          key={day}
          aria-label={longDayLabel(day)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2"
        >
          <span
            aria-hidden="true"
            className={cn(
              "text-[11px] font-semibold tracking-wide",
              isToday ? "text-[#0F2A44]" : "text-[#94A3B8]",
            )}
          >
            {weekdayShortLabel(day)}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-[17px] font-semibold tabular-nums",
              isToday ? "bg-[#0F2A44] text-white" : "text-[#0F2A44]",
            )}
          >
            {dayNumberOf(day)}
          </span>
        </div>
      );
    })}
  </div>
);

export const TechnicianAvatar = ({
  technician,
  className,
}: {
  readonly technician: Technician;
  readonly className: string;
}) => (
  <span
    aria-hidden="true"
    className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", className)}
    style={technician.color.avatarStyle}
  >
    {initialsOf(technician.name)}
  </span>
);

export const TeamHeader = ({
  technicians,
  visitCounts,
}: {
  readonly technicians: readonly Technician[];
  readonly visitCounts: ReadonlyMap<string, number>;
}) => (
  <div className="flex border-b border-[#EEF2F6] pr-6 pl-[72px]">
    {technicians.map((technician) => (
      <div
        key={technician.userId}
        className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-2.5"
      >
        <TechnicianAvatar technician={technician} className="size-6 text-[10px]" />
        <span className="truncate text-[13px] font-semibold">{technician.firstName}</span>
        <span className="text-xs text-[#94A3B8] tabular-nums">
          {visitCounts.get(technician.userId) ?? 0}
        </span>
      </div>
    ))}
  </div>
);
