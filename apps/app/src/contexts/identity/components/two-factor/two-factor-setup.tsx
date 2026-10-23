import { useCallback, useState } from "react";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { errorMessage, toastApiError } from "@/lib/errors";
import { BackupCodes } from "./backup-codes";
import { TotpEnrollment } from "./totp-enrollment";
import { PasswordConfirmation } from "./password-confirmation";

const enableResponse = z.object({ totpURI: z.string(), backupCodes: z.array(z.string()) });

type Enrollment = z.infer<typeof enableResponse>;

type Step =
  | { readonly name: "password" }
  | { readonly name: "scan"; readonly enrollment: Enrollment }
  | { readonly name: "backup"; readonly codes: readonly string[] };

type TwoFactorSetupProps = {
  readonly onDone: () => void;
};

export const TwoFactorSetup = ({ onDone }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<Step>({ name: "password" });
  const enable = useCallback(async (password: string): Promise<string | undefined> => {
    const trace = createTraceRecorder();
    const { data, error } = await authClient.twoFactor.enable(
      { password },
      { onResponse: trace.onResponse },
    );
    if (error) {
      const apiError = trace.toApiError(error);
      if (apiError.code === "invalid_password") {
        return errorMessage(apiError.code);
      }
      toastApiError(apiError);
      return undefined;
    }
    const parsed = enableResponse.safeParse(data);
    if (!parsed.success) {
      toastApiError({ code: "invalid_response", traceId: null });
      return undefined;
    }
    setStep({ name: "scan", enrollment: parsed.data });
    return undefined;
  }, []);
  const showBackupCodes = useCallback((codes: readonly string[]) => {
    setStep({ name: "backup", codes });
  }, []);
  if (step.name === "password") {
    return <PasswordConfirmation onConfirm={enable} />;
  }
  if (step.name === "scan") {
    return (
      <TotpEnrollment
        totpUri={step.enrollment.totpURI}
        backupCodes={step.enrollment.backupCodes}
        onActivated={showBackupCodes}
      />
    );
  }
  return <BackupCodes codes={step.codes} onDone={onDone} />;
};
