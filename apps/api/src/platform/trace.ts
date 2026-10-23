import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { createLogger } from "./logger";

export const TRACE_HEADER = "x-trace-id";

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;

const extractTraceId = (sentryTrace: string | undefined): string | undefined => {
  const candidate = sentryTrace?.split("-")[0];
  return candidate !== undefined && TRACE_ID_PATTERN.test(candidate) ? candidate : undefined;
};

export const newTraceId = (): string => crypto.randomUUID().replaceAll("-", "");

export const traceMiddleware = createMiddleware<AppEnv>(async (context, next) => {
  const traceId = extractTraceId(context.req.header("sentry-trace")) ?? newTraceId();
  context.set("traceId", traceId);
  context.set("logger", createLogger(traceId));
  context.header(TRACE_HEADER, traceId);
  await next();
});
