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
  readonly type?: HTMLInputTypeAttribute;
  readonly inputMode?: "text" | "numeric" | "decimal";
};

const idOf = (name: string) => `equipment-${name}`;

export const EquipmentTextField = ({
  name,
  label,
  isOptional,
  placeholder,
  hint,
  type = "text",
  inputMode,
}: EquipmentTextFieldProps) => {
  const form = useFormContext<EquipmentFormValues>();
  const error = form.formState.errors[name]?.message;
  const id = idOf(name);
  return (
    <FormField id={id} label={label} isOptional={isOptional} error={error} hint={hint}>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(FIELD_CLASS, inputMode === undefined ? undefined : "tabular-nums")}
        {...form.register(name)}
      />
    </FormField>
  );
};
