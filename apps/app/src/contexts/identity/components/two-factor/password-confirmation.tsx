import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSignOutButton } from "@/lib/use-sign-out-button";
import { twoFactorFr } from "../../two-factor-fr";
import { AuthField, authFieldErrorId } from "../auth-field";
import { AuthHeading } from "../auth-heading";
import { AUTH_FIELD_CLASS } from "../auth-styles";
import { PasswordInput } from "../password-input";

const text = twoFactorFr.setup;

type PasswordConfirmationProps = {
  readonly onConfirm: (password: string) => Promise<string | undefined>;
};

export const PasswordConfirmation = ({ onConfirm }: PasswordConfirmationProps) => {
  const { signOut, isSigningOut } = useSignOutButton();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
    [],
  );
  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (password === "") {
        setError(text.passwordRequired);
        return;
      }
      setIsSubmitting(true);
      const fieldError = await onConfirm(password);
      setIsSubmitting(false);
      setError(fieldError);
    },
    [onConfirm, password],
  );
  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading title={text.title} subtitle={text.subtitle} />
      <div className="flex flex-col gap-4">
        <AuthField id="current-password" label={text.passwordLabel} error={error}>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            value={password}
            onChange={change}
            className={AUTH_FIELD_CLASS}
            aria-invalid={error !== undefined}
            aria-describedby={
              error === undefined ? undefined : authFieldErrorId("current-password")
            }
          />
        </AuthField>
        <Button type="submit" disabled={isSubmitting}>
          {text.continue}
        </Button>
        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className="min-h-12 text-sm text-[#475569] hover:text-[#0F2A44] lg:min-h-0 lg:text-[13px]"
        >
          {text.signOut}
        </button>
      </div>
    </form>
  );
};
