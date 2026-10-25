import { CalendarDays } from "lucide-react";
import { useMemo, type HTMLInputTypeAttribute } from "react";
import { useFormContext, useWatch, type FieldPathByValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FIELD_CLASS } from "../customer-styles";
import { describedBy, FormField } from "@/components/form-field";
import type { EquipmentFormValues } from "./equipment-form-schema";
import { plateFieldClassOf, PlateTag, usePlateMark } from "./plate-marks";

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
  const mark = usePlateMark(name);
  const value = useWatch<EquipmentFormValues>({ name });
  const tag = useMemo(() => <PlateTag mark={mark} />, [mark]);
  return (
    <FormField
      id={id}
      label={label}
      isOptional={isOptional && mark === null}
      error={error}
      hint={hint}
      labelAside={tag}
    >
      {mark === "reading" ? (
        <output aria-label={label} className={cn(FIELD_CLASS, "flex items-center border")}>
          <Skeleton className="h-3.5 w-2/5 rounded-md bg-[#E3E8EF]" />
        </output>
      ) : (
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
            placeholder={placeholder ?? unit}
            aria-label={unit === undefined ? undefined : `${label} (${unit})`}
            aria-invalid={error !== undefined}
            aria-describedby={describedBy(id, error, hint)}
            className={cn(
              FIELD_CLASS,
              inputMode === undefined || unit !== undefined ? undefined : "tabular-nums",
              isDate && DATE_INPUT_CLASS,
              plateFieldClassOf(mark),
            )}
            {...form.register(name)}
          />
          {unit === undefined || value === "" ? null : (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-[15px] flex items-center overflow-hidden pr-3.5 text-base whitespace-pre lg:left-[13px] lg:pr-3 lg:text-sm"
            >
              <span className="invisible">{String(value)}</span>
              <span className="ml-[0.18em]">{unit}</span>
            </span>
          )}
        </span>
      )}
    </FormField>
  );
};
