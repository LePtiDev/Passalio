import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { dayNumberOf, longDayLabel, weekDaysOf, weekdayInitial } from "../../planning-dates";

const WeekDayButton = ({
  weekDay,
  isSelected,
  isToday,
  onSelect,
}: {
  readonly weekDay: string;
  readonly isSelected: boolean;
  readonly isToday: boolean;
  readonly onSelect: (day: string) => void;
}) => {
  const select = useCallback(() => onSelect(weekDay), [onSelect, weekDay]);
  return (
    <button
      type="button"
      aria-label={longDayLabel(weekDay)}
      aria-pressed={isSelected}
      onClick={select}
      className="flex min-h-[52px] flex-col items-center justify-center gap-1"
    >
      <span
        aria-hidden="true"
        className={cn(
          "text-[11px] font-semibold",
          isSelected ? "text-[#0F2A44]" : "text-[#94A3B8]",
        )}
      >
        {weekdayInitial(weekDay)}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums",
          isSelected && "bg-[#0F2A44] text-white",
          !isSelected && isToday && "text-[#0E7C5A]",
          !isSelected && !isToday && "text-[#0F2A44]",
        )}
      >
        {dayNumberOf(weekDay)}
      </span>
    </button>
  );
};

export const WeekStrip = ({
  day,
  today,
  onSelect,
}: {
  readonly day: string;
  readonly today: string;
  readonly onSelect: (day: string) => void;
}) => (
  <div className="grid grid-cols-7 border-b border-[#EEF2F6] bg-white px-2 pb-2 lg:hidden">
    {weekDaysOf(day).map((weekDay) => (
      <WeekDayButton
        key={weekDay}
        weekDay={weekDay}
        isSelected={weekDay === day}
        isToday={weekDay === today}
        onSelect={onSelect}
      />
    ))}
  </div>
);
