import { ListFilter } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";

const text = salesFr.list;

const CountBadge = ({
  count,
  className,
}: {
  readonly count: number;
  readonly className: string;
}) =>
  count === 0 ? null : (
    <span
      className={cn(
        "rounded-full bg-[#0F2A44] text-[11px] font-bold text-white tabular-nums",
        className,
      )}
    >
      {count}
    </span>
  );

type FilterTriggerProps = ComponentProps<"button"> & {
  readonly activeCount: number;
  readonly desktopActiveCount: number;
};

export const FilterTrigger = ({
  activeCount,
  desktopActiveCount,
  className,
  ...props
}: FilterTriggerProps) => (
  <button
    type="button"
    aria-label={text.filtersActive(activeCount)}
    className={cn(
      "relative flex size-12 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[#E3E8EF] bg-white text-[13px] font-semibold whitespace-nowrap text-[#0F2A44] outline-none hover:bg-[#F7F9FB] focus-visible:ring-2 focus-visible:ring-ring lg:h-8 lg:w-auto lg:rounded-[7px] lg:px-2.5",
      className,
    )}
    {...props}
  >
    <ListFilter
      aria-hidden="true"
      className="size-5 lg:size-3.5 lg:text-[#64748B]"
      strokeWidth={2}
    />
    <span className="hidden lg:inline">{text.filters}</span>
    <CountBadge
      count={activeCount}
      className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center text-[10px] lg:hidden"
    />
    <CountBadge count={desktopActiveCount} className="hidden px-1.5 lg:inline" />
  </button>
);
