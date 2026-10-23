import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { customersFr } from "../../fr";
import { ERROR_TEXT_CLASS, HINT_TEXT_CLASS, LABEL_CLASS } from "../customer-styles";

type FormFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly isOptional?: boolean | undefined;
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
  readonly labelAside?: ReactNode;
  readonly children: ReactNode;
};

export const fieldErrorId = (id: string) => `${id}-error`;

export const fieldHintId = (id: string) => `${id}-hint`;

export const describedBy = (id: string, error: string | undefined, hint?: string) =>
  [error === undefined ? null : fieldErrorId(id), hint === undefined ? null : fieldHintId(id)]
    .filter((part) => part !== null)
    .join(" ") || undefined;

export const FormField = ({
  id,
  label,
  isOptional,
  error,
  hint,
  labelAside,
  children,
}: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {isOptional === true ? (
          <span className="font-normal text-[#64748B]">{customersFr.form.optional}</span>
        ) : null}
      </Label>
      {labelAside}
    </span>
    {children}
    {error === undefined ? null : (
      <p id={fieldErrorId(id)} className={ERROR_TEXT_CLASS}>
        {error}
      </p>
    )}
    {hint === undefined ? null : (
      <p id={fieldHintId(id)} className={HINT_TEXT_CLASS}>
        {hint}
      </p>
    )}
  </div>
);
