import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { errorMessage, toastApiError } from "@/lib/errors";
import { useSignOutButton } from "@/lib/use-sign-out-button";
import { twoFactorFr } from "../../two-factor-fr";
import { AuthField, authFieldErrorId } from "../auth-field";
import { AuthHeading } from "../auth-heading";
import { TotpCodeInput } from "./totp-code-input";
import { AUTH_FIELD_CLASS, AUTH_LINK_CLASS } from "../auth-styles";

const text = twoFactorFr.code;

const FIELD_ERROR_CODES: ReadonlySet<string> = new Set(["invalid_two_factor_code"]);

type TwoFactorCodeFormProps = {
  readonly subtitle: string;
  readonly onVerified: () => Promise<void>;
};

const verify = (code: string, isBackup: boolean, trace: ReturnType<typeof createTraceRecorder>) =>
  isBackup
    ? authClient.twoFactor.verifyBackupCode({ code }, { onResponse: trace.onResponse })
    : authClient.twoFactor.verifyTotp({ code }, { onResponse: trace.onResponse });

export const TwoFactorCodeForm = ({ subtitle, onVerified }: TwoFactorCodeFormProps) => {
  const { signOut, isSigningOut } = useSignOutButton();
  const [code, setCode] = useState("");
  const [isBackup, setIsBackup] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value),
    [],
  );
  const toggleBackup = useCallback(() => {
    setIsBackup((current) => !current);
    setCode("");
    setError(undefined);
  }, []);
  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = code.replaceAll(/\s/g, "");
      if (trimmed === "") {
        setError(text.required);
        return;
      }
      setIsSubmitting(true);
      const trace = createTraceRecorder();
      const result = await verify(trimmed, isBackup, trace);
      if (result.error) {
        setIsSubmitting(false);
        const apiError = trace.toApiError(result.error);
        if (FIELD_ERROR_CODES.has(apiError.code)) {
          setError(errorMessage(apiError.code));
          return;
        }
        toastApiError(apiError);
        return;
      }
      await onVerified();
    },
    [code, isBackup, onVerified],
  );
  const label = isBackup ? text.backupLabel : text.label;
  const describedBy = error === undefined ? undefined : authFieldErrorId("two-factor-code");
  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading title={text.title} subtitle={subtitle} />
      <div className="flex flex-col gap-4">
        <AuthField id="two-factor-code" label={label} error={error}>
          {isBackup ? (
            <Input
              id="two-factor-code"
              value={code}
              onChange={change}
              autoComplete="off"
              maxLength={32}
              className={`${AUTH_FIELD_CLASS} tracking-[0.1em]`}
              aria-invalid={error !== undefined}
              aria-describedby={describedBy}
            />
          ) : (
            <TotpCodeInput
              id="two-factor-code"
              value={code}
              onChange={setCode}
              isInvalid={error !== undefined}
              describedBy={describedBy}
            />
          )}
        </AuthField>
        {isBackup ? <p className="-mt-2 text-[13px] text-[#64748B]">{text.backupHint}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? text.submitting : text.submit}
        </Button>
        <div className="flex items-center justify-between gap-3 text-sm lg:text-[13px]">
          <button
            type="button"
            onClick={toggleBackup}
            className={`min-h-12 text-left lg:min-h-0 ${AUTH_LINK_CLASS}`}
          >
            {isBackup ? text.switchToApp : text.switchToBackup}
          </button>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="min-h-12 text-[#475569] hover:text-[#0F2A44] lg:min-h-0"
          >
            {text.changeAccount}
          </button>
        </div>
      </div>
    </form>
  );
};
