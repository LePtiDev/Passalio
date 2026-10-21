import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toastApiError } from "@/lib/errors";
import { identityFr } from "../fr";

const signInSchema = z.object({
  email: z.email({ error: identityFr.signIn.invalidEmail }),
});

type SignInValues = z.infer<typeof signInSchema>;

type SignInFormProps = {
  readonly returnTo: string;
};

export const SignInForm = ({ returnTo }: SignInFormProps) => {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });
  const useOtherEmail = useCallback(() => setSentTo(null), []);

  const submit = form.handleSubmit(async ({ email }) => {
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: `${window.location.origin}${returnTo}`,
    });
    if (error) {
      toastApiError({ code: error.status === 429 ? "rate_limited" : "internal", traceId: null });
      return;
    }
    setSentTo(email);
  });

  if (sentTo !== null) {
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <h1 className="text-2xl font-bold">{identityFr.signIn.checkInboxTitle}</h1>
        <p>{identityFr.signIn.checkInbox(sentTo)}</p>
        <Button variant="outline" className="h-12 text-base" onClick={useOtherEmail}>
          {identityFr.signIn.otherEmail}
        </Button>
      </div>
    );
  }

  const emailError = form.formState.errors.email?.message;
  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <h1 className="text-2xl font-bold">{identityFr.signIn.title}</h1>
      <p className="text-muted-foreground">{identityFr.signIn.subtitle}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{identityFr.signIn.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={identityFr.signIn.emailPlaceholder}
          className="h-12 text-base"
          aria-invalid={emailError !== undefined}
          {...form.register("email")}
        />
        {emailError === undefined ? null : <p className="text-sm text-destructive">{emailError}</p>}
      </div>
      <Button type="submit" className="h-12 text-base" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? identityFr.signIn.sending : identityFr.signIn.submit}
      </Button>
    </form>
  );
};
