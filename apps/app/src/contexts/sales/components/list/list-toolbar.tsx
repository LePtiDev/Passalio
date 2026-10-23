import { useCallback, useMemo, type ReactNode } from "react";
import { SearchField } from "@/components/search-field";
import { FilterChips } from "./filter-chips";
import { FiltersMenu } from "./filters-menu";
import { activeFiltersOf, type FilterGroup } from "./list-filters";

type ListToolbarProps = {
  readonly children: ReactNode;
  readonly search: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly groups: readonly FilterGroup[];
  readonly onSearchChange: (search: string) => void;
};

export const ListToolbar = ({
  children,
  search,
  searchLabel,
  searchPlaceholder,
  groups,
  onSearchChange,
}: ListToolbarProps) => {
  const filters = useMemo(() => activeFiltersOf(groups), [groups]);
  const desktopCount = filters.filter(({ group }) => group.isMobileOnly !== true).length;
  const clear = useCallback(() => {
    for (const { group } of filters) {
      if (group.isMobileOnly !== true) {
        group.onChange(null);
      }
    }
  }, [filters]);
  return (
    <div className="flex flex-col gap-3">
      {children}
      <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <SearchField
            value={search}
            label={searchLabel}
            placeholder={searchPlaceholder}
            onChange={onSearchChange}
            className="min-w-0 flex-1 lg:flex-none"
          />
          <FiltersMenu
            groups={groups}
            activeCount={filters.length}
            desktopActiveCount={desktopCount}
            onClear={clear}
          />
        </div>
        <FilterChips filters={filters} onClear={clear} />
      </div>
    </div>
  );
};
