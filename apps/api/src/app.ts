import { Hono } from "hono";
import type { AppEnv } from "./env";
import { traceMiddleware } from "./platform/trace";

export const app = new Hono<AppEnv>()
  .use(traceMiddleware)
  .get("/health", (context) => context.json({ status: "ok" }));
