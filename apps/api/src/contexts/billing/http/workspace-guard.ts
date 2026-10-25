import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../../env";
import { checkWorkspaceAccess } from "../application/check-workspace-access";
import { canWriteIn } from "../domain/workspace-access";
import { isBillingEnabled } from "../infrastructure/billing-dependencies";
import { billingDependencies } from "./billing-context";

const READ_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

const PATHS_OPEN_TO_BLOCKED_WORKSPACES: readonly RegExp[] = [
  /^\/api\/auth(\/|$)/,
  /^\/api\/admin(\/|$)/,
  /^\/api\/billing(\/|$)/,
  /^\/api\/team-invitations(\/|$)/,
  /^\/api\/sync\/push$/,
  /^\/api\/organizations$/,
];

const isOpenToBlockedWorkspaces = (method: string, path: string) =>
  READ_METHODS.has(method) || PATHS_OPEN_TO_BLOCKED_WORKSPACES.some((open) => open.test(path));

export const workspaceGuardMiddleware = createMiddleware<AppEnv>(async (context, next) => {
  const organizationId = context.get("session")?.session.activeOrganizationId;
  if (
    !isBillingEnabled(context.env) ||
    organizationId === null ||
    organizationId === undefined ||
    isOpenToBlockedWorkspaces(context.req.method, context.req.path)
  ) {
    return next();
  }
  const access = await checkWorkspaceAccess(billingDependencies(context.var, context.env))(
    organizationId,
  );
  if (access !== undefined && !canWriteIn(access)) {
    context.get("logger").warn({ event: "workspace_write_refused", reason: access.blockedReason });
    return context.json({ error: "workspace_blocked", traceId: context.get("traceId") }, 403);
  }
  return next();
});
