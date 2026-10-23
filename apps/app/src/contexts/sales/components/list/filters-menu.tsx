import { useCallback, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { FilterOptionList } from "./filter-option-list";
import { FilterTrigger } from "./filter-trigger";
import { FiltersDrawer } from "./filters-drawer";
import { selectedLabelOf, type FilterGroup } from "./list-filters";

const text = salesFr.list;

export type FiltersMenuProps = {
  readonly groups: readonly FilterGroup[];
  readonly activeCount: number;
  readonly desktopActiveCount: number;
  readonly onClear: () => void;
};

const GroupSubMenu = ({
  group,
  onPicked,
}: {
  readonly group: FilterGroup;
  readonly onPicked: () => void;
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger chevronSide="start" className="min-h-9 gap-2 px-2.5 text-[13px]">
      <span className="font-medium text-[#0F2A44]">{group.label}</span>
      <span
        className={cn(
          "ml-auto max-w-36 truncate text-[#64748B]",
          group.value !== null && "font-semibold text-[#0F2A44]",
        )}
      >
        {selectedLabelOf(group)}
      </span>
    </DropdownMenuSubTrigger>
    <DropdownMenuSubContent dir="ltr" sideOffset={6} className="w-72 p-0">
      <FilterOptionList group={group} onPicked={onPicked} />
    </DropdownMenuSubContent>
  </DropdownMenuSub>
);

const DesktopFiltersMenu = ({
  groups,
  activeCount,
  desktopActiveCount,
  onClear,
}: FiltersMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const desktopGroups = groups.filter((group) => group.isMobileOnly !== true);
  return (
    <DropdownMenu dir="rtl" open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <FilterTrigger activeCount={activeCount} desktopActiveCount={desktopActiveCount} />
      </DropdownMenuTrigger>
      <DropdownMenuContent dir="ltr" align="end" className="w-80">
        <DropdownMenuLabel className="text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
          {text.filters}
        </DropdownMenuLabel>
        {desktopGroups.map((group) => (
          <GroupSubMenu key={group.key} group={group} onPicked={close} />
        ))}
        {desktopActiveCount === 0 ? null : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onClear}
              className="min-h-9 px-2.5 text-[13px] text-[#64748B]"
            >
              {text.clearAllFilters}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const FiltersMenu = (props: FiltersMenuProps) =>
  useMediaQuery(DESKTOP_QUERY) ? <DesktopFiltersMenu {...props} /> : <FiltersDrawer {...props} />;
