import type { MonthlyActivityResponse } from "@passalio/shared";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { longMonth, shortMonth } from "../../calendar-labels";

const BAR_HEIGHT = 130;

type MonthBarProps = {
  readonly heightPx: number;
  readonly isCurrent: boolean;
  readonly title: string;
};

const MonthBar = ({ heightPx, isCurrent, title }: MonthBarProps) => {
  const style = useMemo(() => ({ height: `${heightPx}px` }), [heightPx]);
  return (
    <span
      title={title}
      className={cn("block w-full max-w-11 rounded-t", isCurrent ? "bg-[#F59E0B]" : "bg-[#0E7C5A]")}
      style={style}
    />
  );
};

type MonthlyBarsProps = {
  readonly months: readonly MonthlyActivityResponse[];
  readonly label: string;
  readonly unit: string;
};

export const MonthlyBars = ({ months, label, unit }: MonthlyBarsProps) => {
  const max = Math.max(...months.map(({ activeDays }) => activeDays), 1);
  return (
    <ol
      aria-label={label}
      className="grid h-[180px] grid-cols-6 items-end gap-3 border-b border-[#E3E8EF] pb-0"
    >
      {months.map(({ month, activeDays }, index) => {
        const isCurrent = index === months.length - 1;
        return (
          <li key={month} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span
              className={cn(
                "text-xs font-bold tabular-nums",
                index >= months.length - 2 ? "text-[#0F2A44]" : "text-[#94A3B8]",
              )}
            >
              {activeDays}
            </span>
            <MonthBar
              heightPx={Math.max(Math.round((activeDays / max) * BAR_HEIGHT), 2)}
              isCurrent={isCurrent}
              title={`${longMonth(month)} : ${activeDays} ${unit}`}
            />
            <span className="sr-only">{`${longMonth(month)} : ${activeDays} ${unit}`}</span>
          </li>
        );
      })}
    </ol>
  );
};

export const MonthAxis = ({
  months,
}: {
  readonly months: readonly { readonly month: string }[];
}) => (
  <div
    aria-hidden="true"
    className="grid grid-cols-6 gap-3 pt-2 text-center text-xs text-[#64748B]"
  >
    {months.map(({ month }) => (
      <span key={month}>{shortMonth(month)}</span>
    ))}
  </div>
);
