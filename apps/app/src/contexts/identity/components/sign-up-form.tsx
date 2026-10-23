import { zodResolver } from "@hookform/resolvers/zod";
import { TERMS_VERSION } from "@passalio/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { toastApiError } from "@/lib/errors";
import { SIGN_IN_PATH } from "@/lib/session";
import { identityFr } from "../fr";
import { useTurnstile } from "../hooks/use-turnstile";
import { AuthField, authFieldErrorId } from "./auth-field";
import { AcceptTermsLabel } from "./accept-terms-label";
import { AuthHeading } from "./auth-heading";
import { AUTH_FIELD_CLASS, AUTH_LINK_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "./auth-styles";
import { CheckboxField } from "./checkbox-field";
import { PasswordInput } from "./password-input";
import { newPasswordSchema } from "./password-schema";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { TurnstileSlot } from "./turnstile-slot";

const text = identityFr.signUp;

const requiredName = z.string().trim().min(1, { error: text.nameRequired }).max(60);

const signUpSchema = z.object({
  firstName: requiredName,
  lastName: requiredName,
  email: z.email({ error: identityFr.fields.invalidEmail }),
  password: newPasswordSchema,
  hasAcceptedTerms: z.boolean().refine((isAccepted) => isAccepted, { error: text.termsRequired }),
});

type SignUpInput = z.input<typeof signUpSchema>;
type SignUpValues = z.output<typeof signUpSchema>;

type SignUpFormProps = {
  readonly returnTo: string;
};

const STRENGTH_ID = "password-strength";

const ACCEPT_TERMS_LABEL = <AcceptTermsLabel />;

export const SignUpForm = ({ returnTo }: SignUpFormProps) => {
  const navigate = useNavigate();
  const turnstile = useTurnstile();
  const form = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      hasAcceptedTerms: false,
    },
  });

  const submit = form.handleSubmit(async ({ firstName, lastName, email, password }) => {
    const headers = await turnstile.captchaHeaders();
    if (headers === null) {
      toastApiError({ code: "captcha_failed", traceId: null });
      return;
    }
    const trace = createTraceRecorder();
    const { error } = await authClient.signUp.email(
      { name: `${firstName} ${lastName}`, email, password, termsVersion: TERMS_VERSION },
      { headers, onResponse: trace.onResponse },
    );
    if (error) {
      turnstile.reset();
      toastApiError(trace.toApiError(error));
      return;
    }
    await navigate({ to: returnTo });
  });

  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });
  const signInSearch = useMemo(
    () => ({ retour: returnTo === "/" ? undefined : returnTo }),
    [returnTo],
  );
  const describedBy = (field: keyof SignUpInput) =>
    errors[field] === undefined ? undefined : authFieldErrorId(field);

  return (
    <form className="flex flex-col gap-5 lg:gap-[22px]" onSubmit={submit} noValidate>
      <AuthHeading title={text.title} subtitle={text.subtitle} />
      <div className="flex flex-col gap-4 lg:gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <AuthField id="firstName" label={text.firstNameLabel} error={errors.firstName?.message}>
            <Input
              id="firstName"
              autoComplete="given-name"
              className={AUTH_FIELD_CLASS}
              aria-invalid={errors.firstName !== undefined}
              aria-describedby={describedBy("firstName")}
              {...form.register("firstName")}
            />
          </AuthField>
          <AuthField id="lastName" label={text.lastNameLabel} error={errors.lastName?.message}>
            <Input
              id="lastName"
              autoComplete="family-name"
              className={AUTH_FIELD_CLASS}
              aria-invalid={errors.lastName !== undefined}
              aria-describedby={describedBy("lastName")}
              {...form.register("lastName")}
            />
          </AuthField>
        </div>
        <AuthField
          id="email"
          label={identityFr.fields.workEmailLabel}
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={identityFr.fields.emailPlaceholder}
            className={AUTH_FIELD_CLASS}
            aria-invalid={errors.email !== undefined}
            aria-describedby={describedBy("email")}
            {...form.register("email")}
          />
        </AuthField>
        <AuthField
          id="password"
          label={identityFr.fields.passwordLabel}
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className={AUTH_FIELD_CLASS}
            aria-invalid={errors.password !== undefined}
            aria-describedby={
              errors.password === undefined
                ? STRENGTH_ID
                : `${STRENGTH_ID} ${authFieldErrorId("password")}`
            }
            {...form.register("password")}
          />
          <PasswordStrengthMeter id={STRENGTH_ID} password={password} />
        </AuthField>
        <CheckboxField
          control={form.control}
          name="hasAcceptedTerms"
          label={ACCEPT_TERMS_LABEL}
          error={errors.hasAcceptedTerms?.message}
        />
        <div className="flex flex-col">
          <TurnstileSlot
            containerRef={turnstile.containerRef}
            isInteractive={turnstile.isInteractive}
          />
          <Button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
            {isSubmitting ? text.submitting : text.submit}
          </Button>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground lg:text-[13px]">
        {text.hasAccount}{" "}
        <Link to={SIGN_IN_PATH} search={signInSearch} className={AUTH_LINK_CLASS}>
          {text.signIn}
        </Link>
      </p>
    </form>
  );
};
