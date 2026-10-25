import { useCallback } from "react";
import { useController, useFormContext } from "react-hook-form";
import { describedBy, FormField } from "@/contexts/customers";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, SELECT_TRIGGER_CLASS } from "../sales-styles";
import type { ConfigurationField, ConfigurationFormValues } from "./configuration-form-schema";

const ITEM_CLASS = "min-h-12 text-base lg:min-h-8 lg:text-[13px]";

type SelectFieldName = "provider" | "smtpPort" | "reminderNotify";

type TextFieldName = Exclude<ConfigurationField, SelectFieldName | "signature">;

const idOf = (name: ConfigurationField) => `configuration-${name}`;

type TextFieldProps = {
  readonly name: TextFieldName;
  readonly label: string;
  readonly isRequired?: boolean;
  readonly hint?: string | undefined;
  readonly type?: "text" | "email" | "password";
  readonly autoComplete?: string;
  readonly className?: string;
};

export const ConfigurationTextField = ({
  name,
  label,
  isRequired = false,
  hint,
  type = "text",
  autoComplete = "off",
  className,
}: TextFieldProps) => {
  const { register, getFieldState, formState } = useFormContext<ConfigurationFormValues>();
  const error = getFieldState(name, formState).error?.message;
  const id = idOf(name);
  return (
    <div className={className}>
      <FormField id={id} label={label} isRequired={isRequired} error={error} hint={hint}>
        <Input
          id={id}
          type={type}
          inputMode={type === "email" ? "email" : undefined}
          autoComplete={autoComplete}
          aria-required={isRequired ? "true" : undefined}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy(id, error, hint)}
          className={FIELD_CLASS}
          {...register(name)}
        />
      </FormField>
    </div>
  );
};

type SelectFieldProps<Name extends SelectFieldName> = {
  readonly name: Name;
  readonly label: string;
  readonly options: readonly {
    readonly value: ConfigurationFormValues[Name];
    readonly label: string;
  }[];
  readonly hint?: string | undefined;
  readonly onChosen?: (value: ConfigurationFormValues[Name]) => void;
};

export const ConfigurationSelectField = <Name extends SelectFieldName>({
  name,
  label,
  options,
  hint,
  onChosen,
}: SelectFieldProps<Name>) => {
  const { field } = useController<ConfigurationFormValues, SelectFieldName>({ name });
  const id = idOf(name);
  const { onChange } = field;
  const choose = useCallback(
    (value: string) => {
      const option = options.find((candidate) => candidate.value === value);
      if (option !== undefined) {
        onChange(option.value);
        onChosen?.(option.value);
      }
    },
    [options, onChange, onChosen],
  );
  return (
    <FormField id={id} label={label} hint={hint}>
      <Select value={field.value} onValueChange={choose}>
        <SelectTrigger
          id={id}
          aria-describedby={describedBy(id, undefined, hint)}
          className={SELECT_TRIGGER_CLASS}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

export const ConfigurationTextarea = ({
  label,
  hint,
}: {
  readonly label: string;
  readonly hint?: string | undefined;
}) => {
  const { register, getFieldState, formState } = useFormContext<ConfigurationFormValues>();
  const error = getFieldState("signature", formState).error?.message;
  const id = idOf("signature");
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <Textarea
        id={id}
        rows={6}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(FIELD_CLASS, "h-auto min-h-40 py-3 leading-normal lg:h-auto lg:py-2")}
        {...register("signature")}
      />
    </FormField>
  );
};
