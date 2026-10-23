import type { PlatformActor } from "@passalio/shared";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../../env";
import { evaluateAdminAccess, type AdminAccessDenial } from "../domain/admin-access";

export type PlatformEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { readonly platformActor: PlatformActor };
};

const DENIAL_STATUS = {
  not_admin: 404,
  two_factor_required: 403,
  admin_session_expired: 401,
} as const satisfies Record<AdminAccessDenial, number>;

const DENIAL_ERROR = {
  not_admin: "not_found",
  two_factor_required: "two_factor_required",
  admin_session_expired: "admin_session_expired",
} as const satisfies Record<AdminAccessDenial, string>;

export const requirePlatformActor = createMiddleware<PlatformEnv>(async (context, next) => {
  const session = context.get("session");
  if (session === null) {
    return context.json({ error: "not_found", traceId: context.get("traceId") }, 404);
  }
  const access = evaluateAdminAccess(
    {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      isTwoFactorEnabled: session.user.twoFactorEnabled === true,
      isImpersonating: Boolean(session.session.impersonatedBy),
      isBanned: session.user.banned === true,
      signedInAt: new Date(session.session.createdAt),
    },
    new Date(),
  );
  if (!access.isOk) {
    context.get("logger").warn({ event: "admin_access_denied", reason: access.error });
    return context.json(
      { error: DENIAL_ERROR[access.error], traceId: context.get("traceId") },
      DENIAL_STATUS[access.error],
    );
  }
  context.set("platformActor", access.value);
  return next();
});
