import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { createTraceRecorder } from "@/lib/auth-errors";
import { toastApiError } from "@/lib/errors";

const twoFactorRedirect = z.object({ twoFactorRedirect: z.literal(true) });

export const isTwoFactorRedirect = (data: unknown) => twoFactorRedirect.safeParse(data).success;

export const sendMagicLink = async (email: string, returnTo: string) => {
  const trace = createTraceRecorder();
  const { error } = await authClient.signIn.magicLink(
    { email, callbackURL: `${window.location.origin}${returnTo}` },
    { onResponse: trace.onResponse },
  );
  if (error) {
    toastApiError(trace.toApiError(error));
    return false;
  }
  return true;
};
