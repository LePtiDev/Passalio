import { normalizeSearchText } from "@passalio/shared";
import { Check, ChevronDown, Search, UsersRound } from "lucide-react";
import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "@/contexts/customers";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import type { Technician } from "../../technicians";

const text = schedulingFr.team;

type PickerProps = {
  readonly technicians: readonly Technician[];
  readonly selection: readonly string[];
  readonly visitCounts: ReadonlyMap<string, number>;
  readonly onChange: (selection: readonly string[]) => void;
};

export const selectionLabel = (
  technicians: readonly Technician[],
  selection: readonly string[],
) => {
  if (selection.length >= technicians.length) {
    return text.wholeTeam;
  }
  const only = technicians.find(({ userId }) => selection.includes(userId));
  return selection.length === 1 && only !== undefined
    ? only.firstName
    : text.technicianCount(selection.length);
};

const toggled = (selection: readonly string[], userId: string) =>
  selection.includes(userId)
    ? selection.filter((selected) => selected !== userId)
    : [...selection, userId];

const ColorBox = ({
  technician,
  isChecked,
  isLarge,
}: {
  readonly technician: Technician;
  readonly isChecked: boolean;
  readonly isLarge: boolean;
}) => {
  const bar = technician.color.bar;
  const style = useMemo(
    () => ({ borderColor: bar, background: isChecked ? bar : undefined }),
    [bar, isChecked],
  );
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[5px] border-2",
        isLarge ? "size-5" : "size-4",
      )}
      style={style}
    >
      {isChecked ? (
        <Check className={cn("text-white", isLarge ? "size-3.5" : "size-3")} strokeWidth={3} />
      ) : null}
    </span>
  );
};

const PickerOption = ({
  technician,
  isChecked,
  visitCount,
  isLarge,
  onToggle,
}: {
  readonly technician: Technician;
  readonly isChecked: boolean;
  readonly visitCount: number;
  readonly isLarge: boolean;
  readonly onToggle: (userId: string) => void;
}) => {
  const toggle = useCallback(() => onToggle(technician.userId), [onToggle, technician.userId]);
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3",
          isLarge ? "min-h-12 text-[15px]" : "h-8 rounded-md px-2 text-[13px] hover:bg-[#F7F9FB]",
        )}
      >
        <input type="checkbox" checked={isChecked} onChange={toggle} className="sr-only" />
        <ColorBox technician={technician} isChecked={isChecked} isLarge={isLarge} />
        <span className="min-w-0 flex-1 truncate font-medium">{technician.name}</span>
        <span className="text-xs text-[#94A3B8] tabular-nums">{visitCount}</span>
      </label>
    </li>
  );
};

const PickerList = ({
  technicians,
  selection,
  visitCounts,
  onChange,
  isLarge,
}: PickerProps & { readonly isLarge: boolean }) => {
  const [query, setQuery] = useState("");
  const words = normalizeSearchText(query);
  const visible = technicians.filter(({ name }) => normalizeSearchText(name).includes(words));
  const showAll = useCallback(
    () => onChange(technicians.map(({ userId }) => userId)),
    [onChange, technicians],
  );
  const type = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
    [],
  );
  const toggle = useCallback(
    (userId: string) => onChange(toggled(selection, userId)),
    [onChange, selection],
  );
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("flex items-center justify-between", !isLarge && "px-2")}>
        <span className={cn("font-bold", isLarge ? "text-[17px]" : "text-[13px]")}>
          {text.pickerTitle}
        </span>
        <button
          type="button"
          onClick={showAll}
          className={cn(
            "font-semibold text-[#0E7C5A]",
            isLarge ? "min-h-12 text-[15px]" : "min-h-8 text-[13px]",
          )}
        >
          {text.showAll}
        </button>
      </div>
      <label
        className={cn(
          "flex items-center gap-2 border border-[#E3E8EF] text-[#94A3B8]",
          isLarge ? "h-12 rounded-[10px] px-3" : "mx-2 h-8 rounded-[7px] px-2.5",
        )}
      >
        <Search aria-hidden="true" className={isLarge ? "size-4" : "size-3.5"} />
        <input
          type="search"
          value={query}
          onChange={type}
          placeholder={text.search}
          aria-label={text.search}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[#0F2A44] outline-none placeholder:text-[#94A3B8]",
            isLarge ? "text-base" : "text-[13px]",
          )}
        />
      </label>
      {visible.length === 0 ? (
        <p className={cn("text-[#64748B]", isLarge ? "py-3 text-[15px]" : "px-2 py-2 text-[13px]")}>
          {text.noMatch}
        </p>
      ) : (
        <ul className="flex max-h-[50dvh] flex-col overflow-y-auto">
          {visible.map((technician) => (
            <PickerOption
              key={technician.userId}
              technician={technician}
              isChecked={selection.includes(technician.userId)}
              visitCount={visitCounts.get(technician.userId) ?? 0}
              isLarge={isLarge}
              onToggle={toggle}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export const MobileTechnicianPicker = (props: PickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<readonly string[]>(props.selection);
  const { selection, onChange } = props;
  const open = useCallback(
    (next: boolean) => {
      setDraft(selection);
      setIsOpen(next);
    },
    [selection],
  );
  const openSheet = useCallback(() => open(true), [open]);
  const apply = useCallback(() => {
    onChange(draft);
    setIsOpen(false);
  }, [onChange, draft]);
  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label={text.openPicker(props.selection.length)}
        className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#E3E8EF] bg-white text-[#0F2A44]"
      >
        <UsersRound aria-hidden="true" className="size-5" />
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0F2A44] px-1 text-[11px] font-bold text-white tabular-nums ring-2 ring-white"
        >
          {props.selection.length}
        </span>
      </button>
      <Sheet open={isOpen} onOpenChange={open}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-3 rounded-t-[20px] border-0 px-4 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]"
        >
          <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#CBD5E1]" />
          <SheetTitle className="sr-only">{text.pickerTitle}</SheetTitle>
          <PickerList {...props} selection={draft} onChange={setDraft} isLarge />
          <Button
            type="button"
            disabled={draft.length === 0}
            onClick={apply}
            className={cn(PRIMARY_BUTTON_CLASS, "w-full")}
          >
            {text.apply(draft.length)}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

export const DesktopTechnicianPicker = (props: PickerProps) => {
  const { onChange } = props;
  const applyNonEmpty = useCallback(
    (selection: readonly string[]) => {
      if (selection.length > 0) {
        onChange(selection);
      }
    },
    [onChange],
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(SECONDARY_BUTTON_CLASS, "gap-2 data-[state=open]:border-[#0F2A44]")}
        >
          <UsersRound aria-hidden="true" className="size-3.5 text-[#64748B]" />
          {selectionLabel(props.technicians, props.selection)}
          <ChevronDown aria-hidden="true" className="size-3.5 text-[#64748B]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[280px] rounded-xl border-[#E3E8EF] p-2 pt-3 shadow-[0_12px_32px_rgba(15,42,68,0.14)]"
      >
        <PickerList {...props} onChange={applyNonEmpty} isLarge={false} />
      </PopoverContent>
    </Popover>
  );
};
