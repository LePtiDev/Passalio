import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { AUTH_ERROR_CLASS, AUTH_LABEL_CLASS } from "./auth-styles";

type AuthFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly error: string | undefined;
  readonly labelAside?: ReactNode;
  readonly children: ReactNode;
};

export const authFieldErrorId = (id: string) => `${id}-error`;

export const AuthField = ({ id, label, error, labelAside, children }: AuthFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between">
      <Label htmlFor={id} className={AUTH_LABEL_CLASS}>
        {label}
      </Label>
      {labelAside}
    </div>
    {children}
    {error === undefined ? null : (
      <p id={authFieldErrorId(id)} className={AUTH_ERROR_CLASS}>
        {error}
      </p>
    )}
  </div>
);
