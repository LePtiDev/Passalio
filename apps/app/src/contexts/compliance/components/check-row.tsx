import { useCallback } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { fieldErrorId } from "@/components/form-field";
import { ERROR_TEXT_CLASS, HINT_TEXT_CLASS } from "@/components/field-styles";
import { Checkbox } from "@/components/ui/checkbox";

type CheckRowProps<Values extends FieldValues> = {
  readonly control: Control<Values>;
  readonly name: Path<Values>;
  readonly label: string;
  readonly hint?: string | undefined;
  readonly isRequired?: boolean | undefined;
};

export const CheckRow = <Values extends FieldValues>({
  control,
  name,
  label,
  hint,
  isRequired,
}: CheckRowProps<Values>) => {
  const { field, fieldState } = useController({ control, name });
  const { onChange } = field;
  const change = useCallback(
    (checked: boolean | "indeterminate") => onChange(checked === true),
    [onChange],
  );
  const error = fieldState.error?.message;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="flex min-h-12 items-start gap-3 py-3 lg:min-h-8 lg:py-1">
        <Checkbox
          id={name}
          checked={field.value === true}
          onCheckedChange={change}
          aria-invalid={error !== undefined}
          aria-required={isRequired === true ? true : undefined}
          aria-describedby={error === undefined ? undefined : fieldErrorId(name)}
          className="mt-0.5 size-5 data-[state=checked]:border-[#0E7C5A] data-[state=checked]:bg-[#0E7C5A] lg:size-4"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium lg:text-[13px]">
            {label}
            {isRequired === true ? (
              <span aria-hidden="true" className="ml-1 text-destructive">
                *
              </span>
            ) : null}
          </span>
          {hint === undefined ? null : <span className={HINT_TEXT_CLASS}>{hint}</span>}
        </span>
      </label>
      {error === undefined ? null : (
        <p id={fieldErrorId(name)} className={ERROR_TEXT_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
};
