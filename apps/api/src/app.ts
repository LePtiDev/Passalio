import { Hono } from "hono";
import type { AppEnv } from "./env";
import { handleError } from "./platform/errors";
import { traceMiddleware } from "./platform/trace";

export const createApp = () => new Hono<AppEnv>().use(traceMiddleware).onError(handleError);

export const app = createApp().get("/health", (context) => context.json({ status: "ok" }));
