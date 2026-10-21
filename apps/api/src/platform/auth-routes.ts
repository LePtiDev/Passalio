import { Hono } from "hono";
import type { AppEnv } from "../env";
import { AUTH_BASE_PATH } from "./auth";

const ALLOWED_AUTH_PATHS: ReadonlySet<string> = new Set([
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

export const authRoutes = new Hono<AppEnv>().all("/*", (context) => {
  const path = context.req.path.slice(AUTH_BASE_PATH.length);
  if (!ALLOWED_AUTH_PATHS.has(path)) {
    return context.json({ error: "not_found", traceId: context.get("traceId") }, 404);
  }
  return context.get("auth").handler(context.req.raw);
});
