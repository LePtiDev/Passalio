import { CalendarDays } from "lucide-react";
import type { HTMLInputTypeAttribute } from "react";
import { useFormContext, type FieldPathByValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FIELD_CLASS } from "../customer-styles";
import { describedBy, FormField } from "../form/form-field";
import type { EquipmentFormValues } from "./equipment-form-schema";

type EquipmentTextFieldProps = {
  readonly name: FieldPathByValue<EquipmentFormValues, string>;
  readonly label: string;
  readonly isOptional?: boolean;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly unit?: string;
  readonly type?: HTMLInputTypeAttribute;
  readonly inputMode?: "text" | "numeric" | "decimal";
};

const idOf = (name: string) => `equipment-${name}`;

const DATE_INPUT_CLASS =
  "relative pl-10 lg:pl-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

export const EquipmentTextField = ({
  name,
  label,
  isOptional,
  placeholder,
  hint,
  unit,
  type = "text",
  inputMode,
}: EquipmentTextFieldProps) => {
  const form = useFormContext<EquipmentFormValues>();
  const error = form.formState.errors[name]?.message;
  const id = idOf(name);
  const isDate = type === "date";
  return (
    <FormField id={id} label={label} isOptional={isOptional} error={error} hint={hint}>
      <span className="relative flex items-center">
        {isDate ? (
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 z-10 size-4 text-[#94A3B8] lg:left-3"
          />
        ) : null}
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-label={unit === undefined ? undefined : `${label} (${unit})`}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            FIELD_CLASS,
            inputMode === undefined ? undefined : "tabular-nums",
            isDate && DATE_INPUT_CLASS,
            unit !== undefined && "pr-12",
          )}
          {...form.register(name)}
        />
        {unit === undefined ? null : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 text-base text-[#64748B] lg:right-3 lg:text-sm"
          >
            {unit}
          </span>
        )}
      </span>
    </FormField>
  );
};
