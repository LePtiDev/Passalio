import { Hono } from "hono";
import type { AppEnv } from "../env";
import { AUTH_BASE_PATH } from "./auth";
import { TRACE_HEADER } from "./trace";

const ALLOWED_AUTH_PATHS: ReadonlySet<string> = new Set([
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
  "/reset-password",
  "/sign-in/magic-link",
  "/magic-link/verify",
  "/get-session",
  "/sign-out",
  "/list-sessions",
  "/revoke-session",
  "/revoke-other-sessions",
  "/organization/set-active",
  "/organization/list",
]);

const ALLOWED_AUTH_PATH_PREFIXES: readonly string[] = ["/reset-password/"];

const isAllowedAuthPath = (path: string) =>
  ALLOWED_AUTH_PATHS.has(path) ||
  ALLOWED_AUTH_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

const withTraceHeader = (response: Response, traceId: string) => {
  const traced = new Response(response.body, response);
  traced.headers.set(TRACE_HEADER, traceId);
  return traced;
};

export const authRoutes = new Hono<AppEnv>().all("/*", async (context) => {
  const path = context.req.path.slice(AUTH_BASE_PATH.length);
  if (!isAllowedAuthPath(path)) {
    return context.json({ error: "not_found", traceId: context.get("traceId") }, 404);
  }
  const response = await context.get("auth").handler(context.req.raw);
  return withTraceHeader(response, context.get("traceId"));
});
