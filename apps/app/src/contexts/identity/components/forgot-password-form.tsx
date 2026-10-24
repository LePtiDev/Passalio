import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { toastApiError } from "@/lib/errors";
import { RESET_PASSWORD_PATH, SIGN_IN_PATH } from "@/lib/session";
import { identityFr } from "../fr";
import { useTurnstile } from "../hooks/use-turnstile";
import { AuthField, authFieldErrorId } from "./auth-field";
import { AuthHeading } from "./auth-heading";
import { AUTH_FIELD_CLASS, AUTH_TOUCH_LINK_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "./auth-styles";
import { TurnstileSlot } from "./turnstile-slot";

const text = identityFr.forgotPassword;

const forgotPasswordSchema = z.object({
  email: z.email({ error: identityFr.fields.invalidEmail }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const BackToSignIn = () => (
  <p className="text-center text-sm lg:text-[13px]">
    <Link to={SIGN_IN_PATH} className={AUTH_TOUCH_LINK_CLASS}>
      {text.backToSignIn}
    </Link>
  </p>
);

export const ForgotPasswordForm = () => {
  const [isSent, setIsSent] = useState(false);
  const turnstile = useTurnstile();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit(async ({ email }) => {
    const headers = await turnstile.captchaHeaders();
    if (headers === null) {
      toastApiError({ code: "captcha_failed", traceId: null });
      return;
    }
    const trace = createTraceRecorder();
    const { error } = await authClient.requestPasswordReset(
      { email, redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}` },
      { headers, onResponse: trace.onResponse },
    );
    if (error) {
      turnstile.reset();
      toastApiError(trace.toApiError(error));
      return;
    }
    setIsSent(true);
  });

  if (isSent) {
    return (
      <div className="flex flex-col gap-5" aria-live="polite">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent">
          <MailCheck aria-hidden="true" className="size-6 text-success" />
        </span>
        <AuthHeading title={text.sentTitle} subtitle={text.sent} />
        <BackToSignIn />
      </div>
    );
  }

  const { errors, isSubmitting } = form.formState;
  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading title={text.title} subtitle={text.subtitle} />
      <AuthField id="email" label={identityFr.fields.emailLabel} error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={identityFr.fields.emailPlaceholder}
          className={AUTH_FIELD_CLASS}
          aria-invalid={errors.email !== undefined}
          aria-describedby={errors.email === undefined ? undefined : authFieldErrorId("email")}
          {...form.register("email")}
        />
      </AuthField>
      <div className="flex flex-col">
        <TurnstileSlot
          containerRef={turnstile.containerRef}
          isInteractive={turnstile.isInteractive}
        />
        <Button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
          {isSubmitting ? text.submitting : text.submit}
        </Button>
      </div>
      <BackToSignIn />
    </form>
  );
};
