import { useCallback, type ReactNode } from "react";
import { FormField, SELECT_TRIGGER_CLASS } from "@/contexts/customers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { callsFr } from "../../fr-calls";

export const CHOICE_BUTTON_CLASS =
  "h-12 min-w-0 truncate rounded-[10px] border border-[#E3E8EF] bg-white px-3 text-[15px] font-semibold text-[#0F2A44] hover:bg-[#F7F9FB] disabled:opacity-50 aria-pressed:border-[#0F2A44] aria-pressed:bg-[#EEF3F8] lg:h-8 lg:rounded-[7px] lg:text-[13px]";

export type ChoiceOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
};

type ChoiceFieldProps<Value extends string> = {
  readonly id: string;
  readonly label: string;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
  readonly isRequired?: boolean | undefined;
  readonly isDisabled?: boolean | undefined;
  readonly error?: string | undefined;
  readonly labelAside?: ReactNode;
  readonly layout?: "fill" | "wrap" | undefined;
};

const ChoiceButton = <Value extends string>({
  option,
  isPressed,
  isDisabled,
  onChoose,
}: {
  readonly option: ChoiceOption<Value>;
  readonly isPressed: boolean;
  readonly isDisabled: boolean;
  readonly onChoose: (value: Value) => void;
}) => {
  const choose = useCallback(() => onChoose(option.value), [onChoose, option.value]);
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      disabled={isDisabled}
      className={CHOICE_BUTTON_CLASS}
      onClick={choose}
    >
      {option.label}
    </button>
  );
};

const isOptionOf = <Value extends string>(
  options: readonly ChoiceOption<Value>[],
  value: string,
): value is Value => options.some((option) => option.value === value);

export const ChoiceField = <Value extends string>({
  id,
  label,
  options,
  value,
  onChange,
  isRequired,
  isDisabled = false,
  error,
  labelAside,
  layout = "fill",
}: ChoiceFieldProps<Value>) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const chooseFromSelect = useCallback(
    (selected: string) => {
      if (isOptionOf(options, selected)) {
        onChange(selected);
      }
    },
    [options, onChange],
  );
  const errorId = error === undefined ? undefined : `${id}-error`;
  return (
    <FormField id={id} label={label} isRequired={isRequired} error={error} labelAside={labelAside}>
      {isDesktop ? (
        <fieldset
          id={id}
          aria-label={label}
          aria-describedby={errorId}
          className={cn(
            "min-w-0",
            layout === "fill" ? "grid auto-cols-fr grid-flow-col gap-2" : "flex flex-wrap gap-1.5",
          )}
        >
          {options.map((option) => (
            <ChoiceButton
              key={option.value}
              option={option}
              isPressed={option.value === value}
              isDisabled={isDisabled}
              onChoose={onChange}
            />
          ))}
        </fieldset>
      ) : (
        <Select value={value ?? ""} onValueChange={chooseFromSelect} disabled={isDisabled}>
          <SelectTrigger
            id={id}
            aria-required={isRequired === true ? "true" : undefined}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={errorId}
            className={SELECT_TRIGGER_CLASS}
          >
            <SelectValue placeholder={callsFr.session.choose} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="min-h-12">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
};

export const optionsOf = <Value extends string>(
  values: readonly Value[],
  labels: Readonly<Record<Value, string>>,
): readonly ChoiceOption<Value>[] => values.map((value) => ({ value, label: labels[value] }));
