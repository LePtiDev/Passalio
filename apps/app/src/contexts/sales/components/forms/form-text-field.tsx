import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ERROR_TEXT_CLASS, FIELD_CLASS, HINT_TEXT_CLASS, LABEL_CLASS } from "../sales-styles";

type FormTextFieldProps<Values extends FieldValues> = {
  readonly name: Path<Values>;
  readonly label: string;
  readonly optionalLabel?: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly type?: "text" | "email" | "tel" | "url";
  readonly inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  readonly autoComplete?: string;
  readonly className?: string;
};

export const FormTextField = <Values extends FieldValues>({
  name,
  label,
  optionalLabel,
  hint,
  placeholder,
  type = "text",
  inputMode,
  autoComplete = "off",
  className,
}: FormTextFieldProps<Values>) => {
  const { register, getFieldState, formState } = useFormContext<Values>();
  const error = getFieldState(name, formState).error?.message;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy =
    [error === undefined ? null : errorId, hint === undefined ? null : hintId]
      .filter((part) => part !== null)
      .join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={name} className={LABEL_CLASS}>
        {label}
        {optionalLabel === undefined ? null : (
          <span className="font-normal text-[#64748B]">{optionalLabel}</span>
        )}
      </Label>
      <Input
        id={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={FIELD_CLASS}
        {...register(name)}
      />
      {error === undefined ? null : (
        <p id={errorId} className={ERROR_TEXT_CLASS}>
          {error}
        </p>
      )}
      {hint === undefined ? null : (
        <p id={hintId} className={HINT_TEXT_CLASS}>
          {hint}
        </p>
      )}
    </div>
  );
};
