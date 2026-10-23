import { Check } from "lucide-react";
import { useCallback, type KeyboardEvent } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import type { FilterGroup } from "./list-filters";

const text = salesFr.list;

const SEARCH_THRESHOLD = 7;

const ITEM_CLASS = "min-h-12 gap-2.5 px-3 text-base lg:min-h-8 lg:px-2 lg:text-[13px]";

type OptionItemProps = {
  readonly value: string | null;
  readonly label: string;
  readonly isSelected: boolean;
  readonly onPick: (value: string | null) => void;
};

const OptionItem = ({ value, label, isSelected, onPick }: OptionItemProps) => {
  const select = useCallback(() => onPick(value), [onPick, value]);
  return (
    <CommandItem value={label} onSelect={select} className={ITEM_CLASS}>
      <Check
        aria-hidden="true"
        className={cn("size-4 text-[#0F2A44]", isSelected ? "opacity-100" : "opacity-0")}
        strokeWidth={2.4}
      />
      <span className={cn("truncate", isSelected && "font-semibold")}>{label}</span>
    </CommandItem>
  );
};

const focusOnMount = (node: HTMLInputElement | null) => {
  node?.focus();
};

const keepKeysInList = (event: KeyboardEvent) => {
  if (event.key !== "Escape") {
    event.stopPropagation();
  }
};

type FilterOptionListProps = {
  readonly group: FilterGroup;
  readonly onPicked: () => void;
};

export const FilterOptionList = ({ group, onPicked }: FilterOptionListProps) => {
  const { onChange } = group;
  const pick = useCallback(
    (value: string | null) => {
      onChange(value);
      onPicked();
    },
    [onChange, onPicked],
  );
  return (
    <Command className="bg-transparent" onKeyDown={keepKeysInList}>
      {group.options.length > SEARCH_THRESHOLD ? (
        <CommandInput
          ref={focusOnMount}
          placeholder={text.searchIn(group.label)}
          className="h-12 text-base lg:h-9 lg:text-[13px]"
        />
      ) : null}
      <CommandList className="max-h-[52dvh] lg:max-h-72">
        <CommandEmpty className="py-6 text-center text-sm text-[#64748B]">
          {text.noFilterResult}
        </CommandEmpty>
        <CommandGroup className="p-1">
          <OptionItem
            value={null}
            label={group.anyLabel}
            isSelected={group.value === null}
            onPick={pick}
          />
          {group.options.map((option) => (
            <OptionItem
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={group.value === option.value}
              onPick={pick}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
