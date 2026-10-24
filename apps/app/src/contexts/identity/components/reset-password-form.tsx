import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { toastApiError } from "@/lib/errors";
import { FORGOT_PASSWORD_PATH, SIGN_IN_PATH } from "@/lib/session";
import { identityFr } from "../fr";
import { AuthField, authFieldErrorId } from "./auth-field";
import { AuthHeading } from "./auth-heading";
import { AUTH_FIELD_CLASS } from "./auth-styles";
import { PasswordInput } from "./password-input";
import { newPasswordSchema } from "./password-schema";
import { PasswordStrengthMeter } from "./password-strength-meter";

const text = identityFr.resetPassword;

const resetPasswordSchema = z.object({ newPassword: newPasswordSchema });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const STRENGTH_ID = "new-password-strength";

const InvalidResetLink = () => (
  <div className="flex flex-col gap-5" role="alert">
    <AuthHeading title={text.invalidLinkTitle} subtitle={text.invalidLink} />
    <Button asChild>
      <Link to={FORGOT_PASSWORD_PATH}>{text.requestNewLink}</Link>
    </Button>
  </div>
);

export const ResetPasswordForm = ({ token }: { readonly token: string | null }) => {
  const navigate = useNavigate();
  const [isTokenRejected, setIsTokenRejected] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });
  const typedPassword = useWatch({ control: form.control, name: "newPassword" });

  if (token === null || isTokenRejected) {
    return <InvalidResetLink />;
  }

  const submit = form.handleSubmit(async ({ newPassword }) => {
    const trace = createTraceRecorder();
    const { error } = await authClient.resetPassword(
      { newPassword, token },
      { onResponse: trace.onResponse },
    );
    if (error) {
      const apiError = trace.toApiError(error);
      if (apiError.code === "invalid_reset_token") {
        setIsTokenRejected(true);
        return;
      }
      toastApiError(apiError);
      return;
    }
    toast.success(text.done);
    await navigate({ to: SIGN_IN_PATH });
  });

  const { errors, isSubmitting } = form.formState;
  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading title={text.title} subtitle={text.subtitle} />
      <AuthField id="newPassword" label={text.newPasswordLabel} error={errors.newPassword?.message}>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          className={AUTH_FIELD_CLASS}
          aria-invalid={errors.newPassword !== undefined}
          aria-describedby={
            errors.newPassword === undefined
              ? STRENGTH_ID
              : `${STRENGTH_ID} ${authFieldErrorId("newPassword")}`
          }
          {...form.register("newPassword")}
        />
        <PasswordStrengthMeter id={STRENGTH_ID} password={typedPassword} />
      </AuthField>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? text.submitting : text.submit}
      </Button>
    </form>
  );
};
