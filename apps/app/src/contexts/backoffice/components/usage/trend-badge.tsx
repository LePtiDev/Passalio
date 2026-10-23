import type { UsageTrendResponse } from "@passalio/shared";
import { TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { backofficeFr } from "../../fr";

const signed = (percent: number) =>
  `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent)} %`;

type TrendBadgeProps = {
  readonly trend: UsageTrendResponse;
  readonly className?: string;
};

export const TrendBadge = ({ trend, className }: TrendBadgeProps) => {
  if (trend.changePercent === null) {
    return (
      <span className={cn("text-xs font-semibold text-[#334155] tabular-nums", className)}>
        {backofficeFr.usage.recentOnly(trend.recent)}
      </span>
    );
  }
  if (trend.isDropping) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-[#FEF3E2] px-2 py-0.5 text-xs font-bold whitespace-nowrap text-[#B45309] tabular-nums",
          className,
        )}
      >
        <TrendingDown aria-hidden="true" className="size-3" strokeWidth={2.4} />
        {signed(trend.changePercent)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "text-xs font-bold whitespace-nowrap tabular-nums",
        trend.changePercent > 0 ? "text-[#0E7C5A]" : "text-[#64748B]",
        className,
      )}
    >
      {signed(trend.changePercent)}
    </span>
  );
};
