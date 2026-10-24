import { useCallback, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { errorMessage, toastApiError } from "@/lib/errors";
import { twoFactorFr } from "../../two-factor-fr";
import { AuthField, authFieldErrorId } from "../auth-field";
import { AuthHeading } from "../auth-heading";
import { QrCode } from "./qr-code";
import { TotpCodeInput } from "./totp-code-input";

const text = twoFactorFr.setup;

const KEY_GROUP = /.{1,4}/g;

const secretOf = (totpUri: string) => new URL(totpUri).searchParams.get("secret") ?? "";

type TotpEnrollmentProps = {
  readonly totpUri: string;
  readonly backupCodes: readonly string[];
  readonly onActivated: (backupCodes: readonly string[]) => void;
};

export const TotpEnrollment = ({ totpUri, backupCodes, onActivated }: TotpEnrollmentProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = code.replaceAll(/\s/g, "");
      if (trimmed === "") {
        setError(twoFactorFr.code.required);
        return;
      }
      setIsSubmitting(true);
      const trace = createTraceRecorder();
      const { error: verifyError } = await authClient.twoFactor.verifyTotp(
        { code: trimmed },
        { onResponse: trace.onResponse },
      );
      setIsSubmitting(false);
      if (verifyError) {
        const apiError = trace.toApiError(verifyError);
        if (apiError.code === "invalid_two_factor_code") {
          setError(errorMessage(apiError.code));
          return;
        }
        toastApiError(apiError);
        return;
      }
      onActivated(backupCodes);
    },
    [backupCodes, code, onActivated],
  );
  const manualKey = secretOf(totpUri).match(KEY_GROUP)?.join(" ") ?? "";
  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading title={text.title} subtitle={text.subtitle} />
      <div className="flex items-start gap-4">
        <QrCode value={totpUri} label={text.qrLabel} />
        <div className="flex min-w-0 flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">{text.scanTitle}</span>
          <span className="text-[#475569]">{text.scanText}</span>
          <span className="text-xs text-[#64748B]">{text.manualKey}</span>
          <span className="font-mono text-xs font-semibold break-words">{manualKey}</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <AuthField id="totp-code" label={text.codeLabel} error={error}>
          <TotpCodeInput
            id="totp-code"
            value={code}
            onChange={setCode}
            isInvalid={error !== undefined}
            describedBy={error === undefined ? undefined : authFieldErrorId("totp-code")}
          />
        </AuthField>
        <p className="-mt-2 text-xs text-[#64748B]">{text.codeHint}</p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? text.activating : text.activate}
        </Button>
      </div>
    </form>
  );
};
