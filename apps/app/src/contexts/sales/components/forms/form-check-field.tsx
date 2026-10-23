import { useCallback } from "react";
import { useController, type FieldValues, type Path } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type FormCheckFieldProps<Values extends FieldValues> = {
  readonly name: Path<Values>;
  readonly label: string;
};

export const FormCheckField = <Values extends FieldValues>({
  name,
  label,
}: FormCheckFieldProps<Values>) => {
  const { field } = useController<Values>({ name });
  const { onChange } = field;
  const change = useCallback(
    (checked: boolean | "indeterminate") => onChange(checked === true),
    [onChange],
  );
  return (
    <Label
      htmlFor={name}
      className="flex min-h-12 items-center gap-3 text-[15px] font-medium lg:min-h-8 lg:text-[13px]"
    >
      <Checkbox
        id={name}
        checked={field.value === true}
        onCheckedChange={change}
        className="size-5 lg:size-4"
      />
      {label}
    </Label>
  );
};
