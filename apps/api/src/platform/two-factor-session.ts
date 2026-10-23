import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

const TWO_FACTOR_VERIFICATION_PATHS: ReadonlySet<string> = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
]);

export const markTwoFactorVerifiedSession = createAuthMiddleware(async (context) => {
  if (
    !TWO_FACTOR_VERIFICATION_PATHS.has(context.path) ||
    context.context.returned instanceof APIError
  ) {
    return;
  }
  const verified = context.context.newSession ?? (await getSessionFromCtx(context));
  if (verified === null) {
    return;
  }
  await context.context.internalAdapter.updateSession(verified.session.token, {
    twoFactorVerifiedAt: new Date(),
  });
});
