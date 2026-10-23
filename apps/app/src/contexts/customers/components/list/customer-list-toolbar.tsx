import { useCallback } from "react";
import { SearchField } from "@/components/search-field";
import { cn } from "@/lib/utils";
import { customersFr } from "../../fr";
import type { CustomerFilter } from "../../hooks/use-customer-list";

const text = customersFr.list;

const FILTERS: readonly { readonly id: CustomerFilter; readonly badge: string }[] = [
  { id: "all", badge: "text-[#64748B] lg:bg-[#EEF3F8] lg:text-[#0F2A44]" },
  { id: "near", badge: "bg-[#FEF3E2] text-[#B45309]" },
  { id: "overdue", badge: "bg-[#FEF3F2] text-[#B42318]" },
];

type Counts = Readonly<Record<CustomerFilter, number>>;

type ToolbarProps = {
  readonly query: string;
  readonly filter: CustomerFilter;
  readonly counts: Counts | null;
  readonly onQueryChange: (query: string) => void;
  readonly onFilterChange: (filter: CustomerFilter) => void;
};

const FilterButton = ({
  id,
  badge,
  isActive,
  count,
  onSelect,
}: {
  readonly id: CustomerFilter;
  readonly badge: string;
  readonly isActive: boolean;
  readonly count: number | null;
  readonly onSelect: (filter: CustomerFilter) => void;
}) => {
  const select = useCallback(() => onSelect(id), [id, onSelect]);
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={select}
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-[9px] text-sm lg:-mb-px lg:h-auto lg:rounded-none lg:border-b-2 lg:py-2.5 lg:text-[13px]",
        isActive
          ? "bg-white font-semibold text-[#0F2A44] shadow-[0_1px_2px_rgba(15,42,68,0.1)] lg:border-[#0F2A44] lg:bg-transparent lg:shadow-none"
          : "font-medium text-[#475569] lg:border-transparent lg:text-[#64748B]",
      )}
    >
      <span className="lg:hidden">{text.mobileFilters[id]}</span>
      <span className="hidden lg:inline">{text.filters[id]}</span>
      {count === null ? null : (
        <span className={cn("rounded-full px-[7px] py-px text-xs font-semibold", badge)}>
          {count}
        </span>
      )}
    </button>
  );
};

export const CustomerListToolbar = ({
  query,
  filter,
  counts,
  onQueryChange,
  onFilterChange,
}: ToolbarProps) => {
  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-end lg:justify-between lg:gap-4 lg:border-b lg:border-[#E3E8EF]">
      <SearchField
        value={query}
        label={text.searchLabel}
        placeholder={text.searchPlaceholder}
        onChange={onQueryChange}
        className="lg:mb-2"
      />
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#EAEFF4] p-1 lg:flex lg:gap-6 lg:rounded-none lg:bg-transparent lg:p-0">
        {FILTERS.map(({ id, badge }) => (
          <FilterButton
            key={id}
            id={id}
            badge={badge}
            isActive={filter === id}
            count={counts === null ? null : counts[id]}
            onSelect={onFilterChange}
          />
        ))}
      </div>
    </div>
  );
};
