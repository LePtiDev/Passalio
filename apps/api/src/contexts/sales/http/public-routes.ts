import { publicCallbackRequest, type PublicCallbackResponse } from "@passalio/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../../../env";
import { createAuditTrail } from "../../../platform/audit-trail";
import { createDatabase } from "../../../platform/database";
import { TRACE_HEADER } from "../../../platform/trace";
import { validateJson } from "../../../platform/validation";
import { requestWebsiteCallback } from "../application/request-website-callback";
import type { WebsiteCallbackError } from "../domain/website-callback-ports";
import { createD1VisitorRateLimit } from "../infrastructure/d1-visitor-rate-limit";
import { createSalesDependencies } from "../infrastructure/sales-dependencies";
import { createTurnstileCheck } from "../infrastructure/turnstile-check";

const ERROR_STATUS: Readonly<Record<WebsiteCallbackError, ContentfulStatusCode>> = {
  robot_suspected: 403,
  too_many_requests: 429,
};

const RECEIVED: PublicCallbackResponse = { status: "received" };

export const publicRoutes = new Hono<AppEnv>()
  .use(
    cors({
      origin: (origin, context) => (origin === context.env.SITE_URL ? origin : null),
      allowMethods: ["POST"],
      allowHeaders: ["content-type"],
      exposeHeaders: [TRACE_HEADER],
      maxAge: 86_400,
    }),
  )
  .post("/callback-requests", validateJson(publicCallbackRequest), async (context) => {
    const database = createDatabase(context.env.DB);
    const sales = createSalesDependencies(
      database,
      createAuditTrail(database, context.var.traceId),
    );
    const result = await requestWebsiteCallback({
      ...sales,
      antiRobot: createTurnstileCheck(context.env.TURNSTILE_SECRET_KEY),
      rateLimit: createD1VisitorRateLimit(database),
    })(context.req.valid("json"), {
      ipAddress: context.req.header("cf-connecting-ip") ?? null,
    });
    if (!result.isOk) {
      context.var.logger.warn({ event: "website_callback_refused", reason: result.error });
      return context.json(
        { error: result.error, traceId: context.var.traceId },
        ERROR_STATUS[result.error],
      );
    }
    context.var.logger.info({ event: "website_callback_received", taskId: result.value.taskId });
    return context.json(RECEIVED, 201);
  });
