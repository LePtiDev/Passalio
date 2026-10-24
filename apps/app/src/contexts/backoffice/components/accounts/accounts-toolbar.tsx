import type { AccountsPageResponse } from "@passalio/shared";
import { useCallback } from "react";
import { SearchField } from "@/components/search-field";
import { cn } from "@/lib/utils";
import { ACCOUNT_FILTERS, type AccountFilter } from "../../backoffice-api";
import { backofficeFr } from "../../fr";

const text = backofficeFr.accounts;

const BADGE_CLASS: Readonly<Record<AccountFilter, string>> = {
  all: "text-[#64748B] lg:bg-[#EEF3F8] lg:text-[#0F2A44]",
  trial: "text-[#64748B] lg:bg-[#EEF3F8] lg:text-[#0F2A44]",
  dropping: "bg-[#FEF3E2] text-[#B45309]",
};

type FilterButtonProps = {
  readonly id: AccountFilter;
  readonly isActive: boolean;
  readonly count: number | null;
  readonly onSelect: (filter: AccountFilter) => void;
};

const FilterButton = ({ id, isActive, count, onSelect }: FilterButtonProps) => {
  const select = useCallback(() => onSelect(id), [id, onSelect]);
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={select}
      className={cn(
        "flex h-12 items-center justify-center gap-1.5 rounded-[9px] text-sm whitespace-nowrap lg:-mb-px lg:h-auto lg:rounded-none lg:border-b-2 lg:py-2.5 lg:text-[13px]",
        isActive
          ? "bg-white font-semibold text-[#0F2A44] shadow-[0_1px_2px_rgba(15,42,68,0.1)] lg:border-[#0F2A44] lg:bg-transparent lg:shadow-none"
          : "font-medium text-[#475569] lg:border-transparent lg:text-[#64748B]",
      )}
    >
      <span className="lg:hidden">{text.mobileFilters[id]}</span>
      <span className="hidden lg:inline">{text.filters[id]}</span>
      {count === null || (id !== "all" && count === 0) ? null : (
        <span className={cn("rounded-full px-[7px] py-px text-xs font-semibold", BADGE_CLASS[id])}>
          {count}
        </span>
      )}
    </button>
  );
};

type AccountsToolbarProps = {
  readonly search: string;
  readonly filter: AccountFilter;
  readonly counts: AccountsPageResponse["counts"] | null;
  readonly onSearchChange: (search: string) => void;
  readonly onFilterChange: (filter: AccountFilter) => void;
};

export const AccountsToolbar = ({
  search,
  filter,
  counts,
  onSearchChange,
  onFilterChange,
}: AccountsToolbarProps) => (
  <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-end lg:justify-between lg:gap-4 lg:border-b lg:border-[#E3E8EF]">
    <SearchField
      value={search}
      label={text.searchLabel}
      placeholder={text.searchPlaceholder}
      onChange={onSearchChange}
      className="lg:mb-2"
    />
    <fieldset
      aria-label={text.filtersLabel}
      className="min-w-0 grid grid-cols-3 gap-1 rounded-xl bg-[#EAEFF4] p-1 lg:flex lg:gap-6 lg:rounded-none lg:bg-transparent lg:p-0"
    >
      {ACCOUNT_FILTERS.map((id) => (
        <FilterButton
          key={id}
          id={id}
          isActive={filter === id}
          count={counts === null ? null : counts[id]}
          onSelect={onFilterChange}
        />
      ))}
    </fieldset>
  </div>
);
