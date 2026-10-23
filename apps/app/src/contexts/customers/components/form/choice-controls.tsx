import { useCallback, useId } from "react";
import { cn } from "@/lib/utils";

export type Choice<Value extends string> = {
  readonly value: Value;
  readonly label: string;
};

type ChoiceProps<Value extends string> = {
  readonly label: string;
  readonly choices: readonly Choice<Value>[];
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
  readonly className?: string | undefined;
};

const ChoiceOption = <Value extends string>({
  name,
  choice,
  isSelected,
  className,
  onSelect,
}: {
  readonly name: string;
  readonly choice: Choice<Value>;
  readonly isSelected: boolean;
  readonly className: string;
  readonly onSelect: (value: Value) => void;
}) => {
  const select = useCallback(() => onSelect(choice.value), [choice.value, onSelect]);
  return (
    <label
      className={cn(
        "cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-[#0E7C5A]/30",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={choice.value}
        checked={isSelected}
        onChange={select}
        className="sr-only"
      />
      {choice.label}
    </label>
  );
};

const GRID_COLUMNS: Readonly<Record<number, string>> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
};

export const SegmentedControl = <Value extends string>({
  label,
  choices,
  value,
  onChange,
  className,
}: ChoiceProps<Value>) => {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid gap-1 rounded-xl bg-[#EAEFF4] p-1",
        GRID_COLUMNS[choices.length] ?? "grid-flow-col auto-cols-fr",
        className,
      )}
    >
      {choices.map((choice) => (
        <ChoiceOption
          key={choice.value}
          name={name}
          choice={choice}
          isSelected={choice.value === value}
          onSelect={onChange}
          className={cn(
            "flex h-10 items-center justify-center rounded-[9px] text-sm lg:h-8 lg:text-[13px]",
            choice.value === value
              ? "bg-white font-semibold shadow-[0_1px_2px_rgba(15,42,68,0.1)]"
              : "font-medium text-[#475569]",
          )}
        />
      ))}
    </div>
  );
};
