import { X } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import type { ActiveFilter } from "./list-filters";

const text = salesFr.list;

const FilterChip = ({ filter }: { readonly filter: ActiveFilter }) => {
  const { group, option } = filter;
  const { onChange } = group;
  const remove = useCallback(() => onChange(null), [onChange]);
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-[#EEF3F8] pr-1 pl-3 text-sm whitespace-nowrap text-[#0F2A44] lg:h-7 lg:rounded-[7px] lg:pr-1.5 lg:pl-2.5 lg:text-xs",
        group.isMobileOnly === true && "lg:hidden",
      )}
    >
      <span className="text-[#64748B]">{group.label}</span>
      <span className="font-semibold">{option.label}</span>
      <button
        type="button"
        onClick={remove}
        aria-label={text.removeFilter(group.label)}
        className="flex size-8 items-center justify-center rounded-[7px] text-[#64748B] hover:bg-[#E3E8EF] lg:size-5 lg:rounded-[5px]"
      >
        <X aria-hidden="true" className="size-3.5 lg:size-3" strokeWidth={2.2} />
      </button>
    </span>
  );
};

type FilterChipsProps = {
  readonly filters: readonly ActiveFilter[];
  readonly onClear: () => void;
};

export const FilterChips = ({ filters, onClear }: FilterChipsProps) => {
  const desktopCount = filters.filter(({ group }) => group.isMobileOnly !== true).length;
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2",
        filters.length === 0 && "hidden",
        desktopCount === 0 && "lg:hidden",
      )}
    >
      {filters.map((filter) => (
        <FilterChip key={filter.group.key} filter={filter} />
      ))}
      {desktopCount === 0 ? null : (
        <button
          type="button"
          onClick={onClear}
          className="hidden h-7 px-1 text-[13px] font-semibold text-[#64748B] hover:text-[#0F2A44] lg:block"
        >
          {text.clearFilters}
        </button>
      )}
    </div>
  );
};
