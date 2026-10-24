import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { FilterOptionList } from "./filter-option-list";
import { FilterTrigger } from "./filter-trigger";
import type { FiltersMenuProps } from "./filters-menu";
import { selectedLabelOf, type FilterGroup } from "./list-filters";

const text = salesFr.list;

const GroupRow = ({
  group,
  onOpen,
}: {
  readonly group: FilterGroup;
  readonly onOpen: (key: string) => void;
}) => {
  const open = useCallback(() => onOpen(group.key), [onOpen, group.key]);
  return (
    <li>
      <button
        type="button"
        onClick={open}
        className="flex min-h-14 w-full items-center gap-3 border-b border-[#EEF1F5] px-4 text-left active:bg-[#F7F9FB]"
      >
        <span className="text-base font-medium text-[#0F2A44]">{group.label}</span>
        <span
          className={cn(
            "ml-auto truncate text-[15px] text-[#64748B]",
            group.value !== null && "font-semibold text-[#0F2A44]",
          )}
        >
          {selectedLabelOf(group)}
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[#94A3B8]" />
      </button>
    </li>
  );
};

export const FiltersDrawer = ({
  groups,
  activeCount,
  desktopActiveCount,
}: Omit<FiltersMenuProps, "onClear">) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openGroup = groups.find((group) => group.key === openKey) ?? null;
  const back = useCallback(() => setOpenKey(null), []);
  const changeOpen = useCallback((next: boolean) => {
    setIsOpen(next);
    setOpenKey(null);
  }, []);
  const close = useCallback(() => changeOpen(false), [changeOpen]);
  const clearAll = useCallback(() => {
    for (const group of groups) {
      group.onChange(null);
    }
  }, [groups]);
  return (
    <Drawer open={isOpen} onOpenChange={changeOpen} repositionInputs={false}>
      <DrawerTrigger asChild>
        <FilterTrigger activeCount={activeCount} desktopActiveCount={desktopActiveCount} />
      </DrawerTrigger>
      <DrawerContent className="max-h-[88dvh]">
        <DrawerHeader className="flex-row items-center gap-1 px-2 pb-2 text-left">
          {openGroup === null ? null : (
            <button
              type="button"
              onClick={back}
              aria-label={text.backToFilters}
              className="flex size-12 items-center justify-center rounded-[10px] text-[#0F2A44] active:bg-[#F7F9FB]"
            >
              <ChevronLeft aria-hidden="true" className="size-6" />
            </button>
          )}
          <DrawerTitle className={cn("text-lg text-[#0F2A44]", openGroup === null && "px-2")}>
            {openGroup?.label ?? text.filters}
          </DrawerTitle>
          <DrawerDescription className="sr-only">{text.filters}</DrawerDescription>
        </DrawerHeader>
        {openGroup === null ? (
          <ul className="border-t border-[#EEF1F5]">
            {groups.map((group) => (
              <GroupRow key={group.key} group={group} onOpen={setOpenKey} />
            ))}
          </ul>
        ) : (
          <div className="px-2">
            <FilterOptionList group={openGroup} onPicked={back} />
          </div>
        )}
        {openGroup === null ? (
          <DrawerFooter className="flex-row gap-2 pb-[max(16px,env(safe-area-inset-bottom))]">
            <Button
              variant="secondary"
              onClick={clearAll}
              disabled={activeCount === 0}
              className="flex-1"
            >
              {text.clearAllFilters}
            </Button>
            <Button onClick={close} className="flex-1">
              {text.showResults}
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};
