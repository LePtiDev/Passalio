import { ListFilter } from "lucide-react";
import { useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import type { FilterGroup } from "./list-filters";

const text = salesFr.list;

const ANY = "";

const ITEM_CLASS = "min-h-12 text-base lg:min-h-8 lg:text-[13px]";

const GroupItems = ({ group }: { readonly group: FilterGroup }) => {
  const { onChange } = group;
  const change = useCallback((value: string) => onChange(value === ANY ? null : value), [onChange]);
  return (
    <div className={cn(group.isMobileOnly === true && "lg:hidden")}>
      <DropdownMenuLabel className="text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
        {group.label}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={group.value ?? ANY} onValueChange={change}>
        <DropdownMenuRadioItem value={ANY} className={ITEM_CLASS}>
          {group.anyLabel}
        </DropdownMenuRadioItem>
        {group.options.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value} className={ITEM_CLASS}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </div>
  );
};

type FiltersMenuProps = {
  readonly groups: readonly FilterGroup[];
  readonly activeCount: number;
  readonly desktopActiveCount: number;
};

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

export const FiltersMenu = ({ groups, activeCount, desktopActiveCount }: FiltersMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label={text.filtersActive(activeCount)}
      className="relative flex size-12 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[#E3E8EF] bg-white text-[13px] font-semibold whitespace-nowrap text-[#0F2A44] outline-none hover:bg-[#F7F9FB] focus-visible:ring-2 focus-visible:ring-ring lg:h-8 lg:w-auto lg:rounded-[7px] lg:px-2.5"
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
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="max-h-[70dvh] w-64 overflow-y-auto">
      {groups.map((group, index) => (
        <div key={group.key}>
          {index === 0 ? null : (
            <DropdownMenuSeparator className={cn(group.isMobileOnly === true && "lg:hidden")} />
          )}
          <GroupItems group={group} />
        </div>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
