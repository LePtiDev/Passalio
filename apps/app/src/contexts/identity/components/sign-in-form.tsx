import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Info, Mail } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { toastApiError } from "@/lib/errors";
import { FORGOT_PASSWORD_PATH, SIGN_IN_CODE_PATH, SIGN_UP_PATH } from "@/lib/session";
import { identityFr } from "../fr";
import { useTurnstile } from "../hooks/use-turnstile";
import { AuthField, authFieldErrorId } from "./auth-field";
import { isTwoFactorRedirect, sendMagicLink } from "./sign-in-requests";
import { AuthHeading } from "./auth-heading";
import {
  AUTH_FIELD_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SECONDARY_BUTTON_CLASS,
} from "./auth-styles";
import { CheckboxField } from "./checkbox-field";
import { MagicLinkSent } from "./magic-link-sent";
import { PasswordInput } from "./password-input";
import { TurnstileSlot } from "./turnstile-slot";

const text = identityFr.signIn;

const signInSchema = z.object({
  email: z.email({ error: identityFr.fields.invalidEmail }),
  password: z.string().min(1, { error: identityFr.fields.passwordRequired }),
  rememberMe: z.boolean(),
});

type SignInValues = z.infer<typeof signInSchema>;

type SignInFormProps = {
  readonly returnTo: string;
};

const FORGOT_PASSWORD_LINK = (
  <Link
    to={FORGOT_PASSWORD_PATH}
    aria-label={text.forgotPassword}
    className={`text-sm lg:text-[13px] ${AUTH_LINK_CLASS}`}
  >
    <span className="lg:hidden">{text.forgotPasswordShort}</span>
    <span className="hidden lg:inline">{text.forgotPassword}</span>
  </Link>
);

export const SignInForm = ({ returnTo }: SignInFormProps) => {
  const navigate = useNavigate();
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const turnstile = useTurnstile();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const submit = form.handleSubmit(async ({ email, password, rememberMe }) => {
    const headers = await turnstile.captchaHeaders();
    if (headers === null) {
      toastApiError({ code: "captcha_failed", traceId: null });
      return;
    }
    const trace = createTraceRecorder();
    const { data, error } = await authClient.signIn.email(
      { email, password, rememberMe },
      { headers, onResponse: trace.onResponse },
    );
    if (error) {
      turnstile.reset();
      toastApiError(trace.toApiError(error));
      return;
    }
    if (isTwoFactorRedirect(data)) {
      await navigate({ to: SIGN_IN_CODE_PATH, search: { retour: returnTo } });
      return;
    }
    await navigate({ to: returnTo });
  });

  const requestMagicLink = useCallback(async () => {
    form.clearErrors("password");
    if (!(await form.trigger("email"))) {
      form.setFocus("email");
      return;
    }
    const email = form.getValues("email");
    setIsSendingLink(true);
    const isSent = await sendMagicLink(email, returnTo);
    setIsSendingLink(false);
    if (isSent) {
      setMagicLinkSentTo(email);
    }
  }, [form, returnTo]);

  const resendMagicLink = useCallback(async () => {
    if (magicLinkSentTo !== null) {
      await sendMagicLink(magicLinkSentTo, returnTo);
    }
  }, [magicLinkSentTo, returnTo]);

  const useOtherEmail = useCallback(() => setMagicLinkSentTo(null), []);

  const signUpSearch = useMemo(
    () => ({ retour: returnTo === "/" ? undefined : returnTo }),
    [returnTo],
  );

  if (magicLinkSentTo !== null) {
    return (
      <MagicLinkSent
        email={magicLinkSentTo}
        onResend={resendMagicLink}
        onUseOtherEmail={useOtherEmail}
      />
    );
  }

  const { errors, isSubmitting } = form.formState;
  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading
        title={text.title}
        subtitle={text.subtitle}
        mobileSubtitle={text.subtitleShort}
      />
      <div className="flex flex-col gap-4 lg:gap-3.5">
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
        <AuthField
          id="password"
          label={identityFr.fields.passwordLabel}
          error={errors.password?.message}
          labelAside={FORGOT_PASSWORD_LINK}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className={AUTH_FIELD_CLASS}
            aria-invalid={errors.password !== undefined}
            aria-describedby={
              errors.password === undefined ? undefined : authFieldErrorId("password")
            }
            {...form.register("password")}
          />
        </AuthField>
        <CheckboxField control={form.control} name="rememberMe" label={text.rememberMe} />
        <div className="flex flex-col">
          <TurnstileSlot
            containerRef={turnstile.containerRef}
            isInteractive={turnstile.isInteractive}
          />
          <Button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
            {isSubmitting ? text.submitting : text.submit}
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
          <span className="h-px flex-1 bg-[#E3E8EF]" />
          {text.or}
          <span className="h-px flex-1 bg-[#E3E8EF]" />
        </div>
        <Button
          type="button"
          variant="outline"
          className={AUTH_SECONDARY_BUTTON_CLASS}
          disabled={isSendingLink}
          onClick={requestMagicLink}
        >
          <Mail aria-hidden="true" className="text-muted-foreground" />
          {text.magicLink}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground lg:text-[13px]">
        {text.noAccount}{" "}
        <Link to={SIGN_UP_PATH} search={signUpSearch} className={AUTH_LINK_CLASS}>
          {text.createAccount}
        </Link>
      </p>
      <div className="hidden gap-2.5 rounded-lg lg:flex border border-[#EEF2F6] bg-[#F7F9FB] p-3 text-xs leading-normal text-muted-foreground">
        <Info aria-hidden="true" className="mt-px size-4 shrink-0 text-[#64748B]" />
        <span>{text.customerHint}</span>
      </div>
    </form>
  );
};
