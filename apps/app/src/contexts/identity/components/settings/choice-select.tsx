import { useCallback } from "react";
import { useController, useFormContext } from "react-hook-form";
import { SELECT_TRIGGER_CLASS } from "@/components/field-styles";
import { describedBy } from "@/components/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompanySettingsValues } from "../../company-settings-form";

type ChoiceSelectProps<Choice extends string> = {
  readonly id: string;
  readonly name: "legalForm" | "registryKind";
  readonly choices: readonly Choice[];
  readonly labels: Readonly<Record<Choice, string>>;
  readonly placeholder: string;
  readonly error: string | undefined;
};

export const ChoiceSelect = <Choice extends string>({
  id,
  name,
  choices,
  labels,
  placeholder,
  error,
}: ChoiceSelectProps<Choice>) => {
  const { control } = useFormContext<CompanySettingsValues>();
  const { field } = useController({ control, name });
  const { onChange } = field;
  const choose = useCallback(
    (value: string) => onChange(choices.find((choice) => choice === value) ?? null),
    [choices, onChange],
  );
  return (
    <Select value={field.value ?? ""} onValueChange={choose} disabled={field.disabled}>
      <SelectTrigger
        id={id}
        aria-required="true"
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, error)}
        className={SELECT_TRIGGER_CLASS}
        onBlur={field.onBlur}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {choices.map((choice) => (
          <SelectItem key={choice} value={choice} className="min-h-12 lg:min-h-8">
            {labels[choice]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
