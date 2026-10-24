import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { describedBy, FIELD_CLASS, FormField, PRIMARY_BUTTON_CLASS } from "@/contexts/customers";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { ServiceRecord } from "@/lib/db/local-records";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { formatDuration, formatEuros, schedulingFr } from "../../fr";
import { chosenServices, usualDurationOf, usualPriceCentsOf } from "../../services";
import { ServiceList } from "./service-list";

const text = schedulingFr.form;

const FIELD_ID = "visit-services";

type ServiceFieldProps = {
  readonly offered: readonly ServiceRecord[];
  readonly value: readonly string[];
  readonly error: string | undefined;
  readonly onChange: (serviceIds: readonly string[]) => void;
};

const TRIGGER_CLASS = cn(
  FIELD_CLASS,
  "flex w-full items-center gap-2 border text-left font-normal text-[#0F2A44] lg:text-sm",
);

const TriggerContent = ({
  offered,
  value,
}: {
  readonly offered: readonly ServiceRecord[];
  readonly value: readonly string[];
}) => (
  <>
    <span className={cn("min-w-0 flex-1 truncate", value.length === 0 && "text-[#94A3B8]")}>
      {value.length === 0
        ? text.servicesPlaceholder
        : chosenServices(offered, value)
            .map(({ name }) => name)
            .join(", ")}
    </span>
    {value.length > 1 ? (
      <span
        aria-label={text.servicesCount(value.length)}
        className="rounded-full bg-[#EEF3F8] px-2 py-0.5 text-xs font-semibold tabular-nums"
      >
        {value.length}
      </span>
    ) : null}
    <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[#64748B]" />
  </>
);

const triggerProps = (error: string | undefined) => ({
  id: FIELD_ID,
  type: "button" as const,
  "aria-required": true,
  "aria-invalid": error === undefined ? undefined : true,
  "aria-describedby": describedBy(FIELD_ID, error, text.servicesHint),
});

const confirmLabelOf = (offered: readonly ServiceRecord[], draft: readonly string[]) => {
  const chosen = chosenServices(offered, draft);
  const price = usualPriceCentsOf(chosen);
  return text.servicesConfirm(
    formatDuration(usualDurationOf(chosen)),
    price === null ? null : formatEuros(price),
  );
};

const totalLabelOf = (offered: readonly ServiceRecord[], value: readonly string[]) => {
  const chosen = chosenServices(offered, value);
  const price = usualPriceCentsOf(chosen);
  return text.servicesTotal(
    chosen.length,
    formatDuration(usualDurationOf(chosen)),
    price === null ? null : formatEuros(price),
  );
};

const keepKeyboardClosed = (event: Event) => event.preventDefault();

const MobileServicePicker = ({ offered, value, error, onChange }: ServiceFieldProps) => {
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
    onChange([...draft]);
    setIsOpen(false);
  }, [onChange, draft]);
  const changeDraft = useCallback((serviceIds: readonly string[]) => setDraft(serviceIds), []);
  return (
    <>
      <button {...triggerProps(error)} onClick={openSheet} className={TRIGGER_CLASS}>
        <TriggerContent offered={offered} value={value} />
      </button>
      <Sheet open={isOpen} onOpenChange={open}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          onOpenAutoFocus={keepKeyboardClosed}
          className="gap-3 rounded-t-[20px] border-0 px-4 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]"
        >
          <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#CBD5E1]" />
          <SheetTitle className="text-[17px] font-bold">{text.services}</SheetTitle>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            <ServiceList offered={offered} value={draft} isLarge onChange={changeDraft} />
          </div>
          <Button type="button" onClick={confirm} className={cn(PRIMARY_BUTTON_CLASS, "w-full")}>
            {draft.length === 0 ? text.confirm : confirmLabelOf(offered, draft)}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

const DesktopServicePicker = ({ offered, value, error, onChange }: ServiceFieldProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button {...triggerProps(error)} className={TRIGGER_CLASS}>
        <TriggerContent offered={offered} value={value} />
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="center"
      className="flex w-[600px] max-w-[calc(100vw-32px)] flex-col gap-2 rounded-xl border-[#E3E8EF] p-2 shadow-[0_12px_32px_rgba(15,42,68,0.14)]"
    >
      <ServiceList offered={offered} value={value} isLarge={false} onChange={onChange} />
      <div className="flex items-center justify-between border-t border-[#EEF2F6] px-2 pt-2 text-xs text-[#64748B]">
        <span>{totalLabelOf(offered, value)}</span>
        <Link to="/reglages/prestations" className="font-semibold text-[#0E7C5A] hover:underline">
          {text.manageServices}
        </Link>
      </div>
    </PopoverContent>
  </Popover>
);

export const ServiceField = (props: ServiceFieldProps) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  return (
    <FormField
      id={FIELD_ID}
      label={text.services}
      isRequired
      error={props.error}
      hint={text.servicesHint}
    >
      {isDesktop ? <DesktopServicePicker {...props} /> : <MobileServicePicker {...props} />}
    </FormField>
  );
};
