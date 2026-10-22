import { useCallback, type ReactNode } from "react";
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { AUTH_ERROR_CLASS } from "./auth-styles";

type CheckboxFieldProps<Values extends FieldValues> = {
  readonly control: Control<Values>;
  readonly name: FieldPathByValue<Values, boolean>;
  readonly label: ReactNode;
  readonly error?: string | undefined;
};

export const CheckboxField = <Values extends FieldValues>({
  control,
  name,
  label,
  error,
}: CheckboxFieldProps<Values>) => {
  const { field } = useController({ control, name });
  const { onChange } = field;
  const onCheckedChange = useCallback(
    (checked: boolean | "indeterminate") => onChange(checked === true),
    [onChange],
  );
  return (
    <div className="flex flex-col gap-1">
      <label className="flex min-h-12 cursor-pointer items-center gap-2.5 py-1 text-sm leading-normal text-[#334155] lg:min-h-0 lg:gap-2 lg:text-[13px]">
        <Checkbox
          checked={field.value === true}
          onCheckedChange={onCheckedChange}
          onBlur={field.onBlur}
          aria-invalid={error !== undefined}
        />
        {label}
      </label>
      {error === undefined ? null : <p className={AUTH_ERROR_CLASS}>{error}</p>}
    </div>
  );
};
