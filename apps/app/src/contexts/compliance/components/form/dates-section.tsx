import { CalendarDays } from "lucide-react";
import type { MouseEvent } from "react";
import { useController, type UseFormReturn } from "react-hook-form";
import { describedBy, FIELD_CLASS, Fieldset, FormField } from "@/contexts/customers";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CertificateFormValues } from "../../certificate-form";
import { complianceFr } from "../../fr";

const text = complianceFr.form;

type DateName = "visitedOn" | "lastSweepingOn" | "lastServiceOn";

const openPicker = (event: MouseEvent<HTMLInputElement>) => {
  event.currentTarget.showPicker();
};

const DateField = ({
  form,
  name,
  max,
  isRequired,
}: {
  readonly form: UseFormReturn<CertificateFormValues>;
  readonly name: DateName;
  readonly max: string;
  readonly isRequired?: boolean;
}) => {
  const { field, fieldState } = useController({ control: form.control, name });
  const id = `certificate-${name}`;
  const error = fieldState.error?.message;
  return (
    <FormField id={id} label={text[name]} isRequired={isRequired} error={error}>
      <div className="relative">
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#64748B] lg:left-3"
        />
        <Input
          {...field}
          id={id}
          type="date"
          max={max}
          aria-required={isRequired === true ? true : undefined}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy(id, error)}
          onClick={openPicker}
          className={cn(
            FIELD_CLASS,
            "pl-10 lg:pl-9 [&::-webkit-calendar-picker-indicator]:opacity-0",
          )}
        />
      </div>
    </FormField>
  );
};

export const DatesSection = ({
  form,
  today,
}: {
  readonly form: UseFormReturn<CertificateFormValues>;
  readonly today: string;
}) => (
  <Fieldset title={text.datesSection}>
    <div className="grid gap-4 lg:grid-cols-3">
      <DateField form={form} name="visitedOn" max={today} isRequired />
      <DateField form={form} name="lastSweepingOn" max={today} />
      <DateField form={form} name="lastServiceOn" max={today} />
    </div>
  </Fieldset>
);
