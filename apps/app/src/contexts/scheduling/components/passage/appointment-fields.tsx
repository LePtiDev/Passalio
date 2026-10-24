import { CalendarDays, Clock } from "lucide-react";
import type { MouseEvent } from "react";
import { useController, type Control } from "react-hook-form";
import { describedBy, FIELD_CLASS, FormField, SELECT_TRIGGER_CLASS } from "@/contexts/customers";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SiteRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import type { VisitFormValues } from "../../visit-form-schema";
import { siteLabelOf } from "./site-label";

const text = schedulingFr.form;

const ICON_CLASS =
  "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#64748B] lg:left-3";

const PICKER_INPUT_CLASS = "pl-10 lg:pl-9 [&::-webkit-calendar-picker-indicator]:opacity-0";

const openPicker = (event: MouseEvent<HTMLInputElement>) => {
  event.currentTarget.showPicker();
};

const IconInput = ({
  id,
  type,
  label,
  icon: Icon,
  control,
  name,
}: {
  readonly id: string;
  readonly type: "date" | "time";
  readonly label: string;
  readonly icon: typeof Clock;
  readonly control: Control<VisitFormValues>;
  readonly name: "scheduledDate" | "startTime";
}) => {
  const { field, fieldState } = useController({ control, name });
  const error = fieldState.error?.message;
  return (
    <FormField id={id} label={label} isRequired error={error}>
      <div className="relative">
        <Icon aria-hidden="true" className={ICON_CLASS} />
        <Input
          {...field}
          id={id}
          type={type}
          aria-required="true"
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy(id, error)}
          onClick={openPicker}
          className={cn(FIELD_CLASS, PICKER_INPUT_CLASS)}
        />
      </div>
    </FormField>
  );
};

export const DateInput = ({ control }: { readonly control: Control<VisitFormValues> }) => (
  <IconInput
    id="visit-date"
    type="date"
    label={text.date}
    icon={CalendarDays}
    control={control}
    name="scheduledDate"
  />
);

export const TimeInput = ({ control }: { readonly control: Control<VisitFormValues> }) => (
  <IconInput
    id="visit-time"
    type="time"
    label={text.time}
    icon={Clock}
    control={control}
    name="startTime"
  />
);

export const SiteSelect = ({
  control,
  sites,
}: {
  readonly control: Control<VisitFormValues>;
  readonly sites: readonly SiteRecord[];
}) => {
  const { field, fieldState } = useController({ control, name: "siteId" });
  return (
    <FormField id="visit-site" label={text.site} isRequired error={fieldState.error?.message}>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id="visit-site" aria-required="true" className={SELECT_TRIGGER_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sites.map((candidate) => (
            <SelectItem key={candidate.id} value={candidate.id} className="min-h-12 lg:min-h-8">
              {siteLabelOf(candidate)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};
