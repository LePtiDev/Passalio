import { useCallback, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export type SegmentOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
};

type SegmentedFieldProps<Value extends string> = {
  readonly name: string;
  readonly label: string;
  readonly options: readonly SegmentOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
};

export const SegmentedField = <Value extends string>({
  name,
  label,
  options,
  value,
  onChange,
}: SegmentedFieldProps<Value>) => {
  const choose = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const chosen = options.find((option) => option.value === event.currentTarget.value);
      if (chosen !== undefined) {
        onChange(chosen.value);
      }
    },
    [options, onChange],
  );
  return (
    <fieldset className="flex gap-1 rounded-[10px] bg-[#EEF2F6] p-1 lg:rounded-[8px]">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const isChecked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center truncate rounded-[8px] px-2 text-[15px] font-medium text-[#475569] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 lg:h-7 lg:rounded-[6px] lg:text-[13px]",
              isChecked &&
                "bg-white font-semibold text-[#0F2A44] shadow-[0_1px_2px_rgba(15,42,68,0.12)]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isChecked}
              onChange={choose}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
};
