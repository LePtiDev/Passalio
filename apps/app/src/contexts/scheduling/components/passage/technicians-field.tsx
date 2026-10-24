import { Check, ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { useController, type Control } from "react-hook-form";
import { describedBy, FIELD_CLASS, FormField, PRIMARY_BUTTON_CLASS } from "@/contexts/customers";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import type { Technician } from "../../technicians";
import type { VisitFormValues } from "../../visit-form-schema";

const text = schedulingFr.form;

const FIELD_ID = "visit-technicians";

type PickerProps = {
  readonly technicians: readonly Technician[];
  readonly value: readonly string[];
  readonly error: string | undefined;
  readonly onChange: (userIds: readonly string[]) => void;
};

const toggledTechnician = (value: readonly string[], userId: string): string[] =>
  value.includes(userId) ? value.filter((chosen) => chosen !== userId) : [...value, userId];

const TechnicianOption = ({
  technician,
  isChecked,
  isLarge,
  onToggle,
}: {
  readonly technician: Technician;
  readonly isChecked: boolean;
  readonly isLarge: boolean;
  readonly onToggle: (userId: string) => void;
}) => {
  const toggle = useCallback(() => onToggle(technician.userId), [onToggle, technician.userId]);
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3",
          isLarge ? "min-h-12 text-base" : "h-9 rounded-md px-2 text-[13px] hover:bg-[#F7F9FB]",
        )}
      >
        <input type="checkbox" className="peer sr-only" checked={isChecked} onChange={toggle} />
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F2A44]",
            isLarge ? "size-5" : "size-4",
            isChecked ? "border-[#0E7C5A] bg-[#0E7C5A] text-white" : "border-[#CBD5E1] bg-white",
          )}
        >
          {isChecked ? <Check className={isLarge ? "size-3.5" : "size-3"} strokeWidth={3} /> : null}
        </span>
        <InitialsAvatar name={technician.name} tone="slate" size="small" />
        <span className="min-w-0 flex-1 truncate font-medium">{technician.name}</span>
      </label>
    </li>
  );
};

const TechnicianList = ({
  technicians,
  value,
  isLarge,
  onChange,
}: Omit<PickerProps, "error"> & { readonly isLarge: boolean }) => {
  const toggle = useCallback(
    (userId: string) => onChange(toggledTechnician(value, userId)),
    [onChange, value],
  );
  return (
    <ul className="flex flex-col">
      {technicians.map((technician) => (
        <TechnicianOption
          key={technician.userId}
          technician={technician}
          isChecked={value.includes(technician.userId)}
          isLarge={isLarge}
          onToggle={toggle}
        />
      ))}
    </ul>
  );
};

const TRIGGER_CLASS = cn(
  FIELD_CLASS,
  "flex h-auto min-h-12 w-full items-center gap-2 border py-1.5 text-left font-normal text-[#0F2A44] lg:min-h-10 lg:text-sm",
);

const Chips = ({
  technicians,
  value,
}: {
  readonly technicians: readonly Technician[];
  readonly value: readonly string[];
}) => {
  const chosen = value.flatMap(
    (userId) => technicians.find((technician) => technician.userId === userId) ?? [],
  );
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {chosen.length === 0 ? (
          <span className="text-[#94A3B8]">{text.technicianPlaceholder}</span>
        ) : (
          chosen.map((technician) => (
            <span
              key={technician.userId}
              className="flex items-center gap-1.5 rounded-full border border-[#E3E8EF] bg-white py-0.5 pr-2.5 pl-0.5 text-sm font-medium"
            >
              <InitialsAvatar name={technician.name} tone="slate" size="small" />
              {technician.name}
            </span>
          ))
        )}
      </span>
      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[#64748B]" />
    </>
  );
};

const triggerProps = (error: string | undefined) => ({
  id: FIELD_ID,
  type: "button" as const,
  "aria-required": true,
  "aria-invalid": error === undefined ? undefined : true,
  "aria-describedby": describedBy(FIELD_ID, error, text.technicianHint),
});

const MobilePicker = ({ technicians, value, error, onChange }: PickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<readonly string[]>(value);
  const open = useCallback(
    (next: boolean) => {
      setDraft(value);
      setIsOpen(next);
    },
    [value],
  );
  const openSheet = useCallback(() => open(true), [open]);
  const confirm = useCallback(() => {
    onChange(draft);
    setIsOpen(false);
  }, [onChange, draft]);
  const changeDraft = useCallback((userIds: readonly string[]) => setDraft(userIds), []);
  return (
    <>
      <button {...triggerProps(error)} onClick={openSheet} className={TRIGGER_CLASS}>
        <Chips technicians={technicians} value={value} />
      </button>
      <Sheet open={isOpen} onOpenChange={open}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-3 rounded-t-[20px] border-0 px-4 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]"
        >
          <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#CBD5E1]" />
          <SheetTitle className="text-[17px] font-bold">{text.technician}</SheetTitle>
          <div className="max-h-[55vh] overflow-y-auto">
            <TechnicianList
              technicians={technicians}
              value={draft}
              isLarge
              onChange={changeDraft}
            />
          </div>
          <Button type="button" onClick={confirm} className={cn(PRIMARY_BUTTON_CLASS, "w-full")}>
            {text.confirm}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

const DesktopPicker = ({ technicians, value, error, onChange }: PickerProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button {...triggerProps(error)} className={TRIGGER_CLASS}>
        <Chips technicians={technicians} value={value} />
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className="w-(--radix-popover-trigger-width) rounded-xl border-[#E3E8EF] p-1.5 shadow-[0_12px_32px_rgba(15,42,68,0.14)]"
    >
      <TechnicianList technicians={technicians} value={value} isLarge={false} onChange={onChange} />
    </PopoverContent>
  </Popover>
);

export const TechniciansField = ({
  control,
  technicians,
}: {
  readonly control: Control<VisitFormValues>;
  readonly technicians: readonly Technician[];
}) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const lead = useController({ control, name: "technicianUserId" });
  const team = useController({ control, name: "technicianUserIds" });
  const leadValue = lead.field.value;
  const value = team.field.value ?? (leadValue === "" ? [] : [leadValue]);
  const error = lead.fieldState.error?.message;
  const { onChange: changeLead } = lead.field;
  const { onChange: changeTeam } = team.field;
  const change = useCallback(
    (userIds: readonly string[]) => {
      changeTeam([...userIds]);
      changeLead(userIds[0] ?? "");
    },
    [changeTeam, changeLead],
  );
  const props = { technicians, value, error, onChange: change };
  return (
    <FormField
      id={FIELD_ID}
      label={text.technician}
      isRequired
      error={error}
      hint={text.technicianHint}
    >
      {isDesktop ? <DesktopPicker {...props} /> : <MobilePicker {...props} />}
    </FormField>
  );
};
