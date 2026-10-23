import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";

const READ_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);
const ADMIN_SPACE = /^\/api\/admin(\/|$)/;

export const impersonationGuardMiddleware = createMiddleware<AppEnv>(async (context, next) => {
  const isImpersonating = Boolean(context.get("session")?.session.impersonatedBy);
  const isAdminSpace = ADMIN_SPACE.test(context.req.path);
  if (isImpersonating && !isAdminSpace && !READ_METHODS.has(context.req.method)) {
    context.get("logger").warn({ event: "impersonation_write_refused" });
    return context.json({ error: "impersonation_read_only", traceId: context.get("traceId") }, 403);
  }
  return next();
});
