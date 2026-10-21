import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { createAuditTrail } from "./audit-trail";
import { createAuth } from "./auth";
import { createDatabase } from "./database";
import { createEmailSender } from "./email";

export const requestServicesMiddleware = createMiddleware<AppEnv>(async (context, next) => {
  const database = createDatabase(context.env.DB);
  const auditTrail = createAuditTrail(database, context.get("traceId"));
  const emailSender = createEmailSender(context.env.EMAIL_DELIVERY, context.get("logger"));
  const auth = createAuth({
    database,
    emailSender,
    auditTrail,
    secret: context.env.BETTER_AUTH_SECRET,
    baseUrl: context.env.BETTER_AUTH_URL,
    appUrl: context.env.APP_URL,
  });
  context.set("database", database);
  context.set("auditTrail", auditTrail);
  context.set("emailSender", emailSender);
  context.set("auth", auth);
  context.set("session", await auth.api.getSession({ headers: context.req.raw.headers }));
  await next();
});
