import { ForbiddenError } from "@passalio/shared";
import type { ErrorHandler } from "hono";
import type { AppEnv } from "../env";

export const handleError: ErrorHandler<AppEnv> = (error, context) => {
  const traceId = context.get("traceId");
  if (error instanceof ForbiddenError) {
    context.get("logger").warn({ event: "permission_denied", permission: error.permission });
    return context.json({ error: "forbidden", traceId }, 403);
  }
  context
    .get("logger")
    .error({ event: "unhandled_error", name: error.name, message: error.message });
  return context.json({ error: "internal", traceId }, 500);
};
