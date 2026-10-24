import { createMiddleware } from "hono/factory";
import { canSignUp, createPlatformSettingsDependencies } from "../contexts/platform-settings";
import type { AppEnv } from "../env";
import { createActivityLog } from "./activity-log";
import { createAuditTrail } from "./audit-trail";
import { createAuth } from "./auth";
import { createDatabase } from "./database";
import { createEmailSender } from "./email";

export const requestServicesMiddleware = createMiddleware<AppEnv>(async (context, next) => {
  const database = createDatabase(context.env.DB);
  const auditTrail = createAuditTrail(database, context.get("traceId"));
  const emailSender = createEmailSender(
    {
      delivery: context.env.EMAIL_DELIVERY,
      resendApiKey: context.env.RESEND_API_KEY,
      from: context.env.EMAIL_FROM,
      assetsUrl: context.env.APP_URL,
    },
    context.get("logger"),
  );
  const auth = createAuth({
    database,
    signUpGate: {
      canSignUp: canSignUp(createPlatformSettingsDependencies({ database, auditTrail })),
    },
    emailSender,
    auditTrail,
    activityLog: createActivityLog(database),
    secret: context.env.BETTER_AUTH_SECRET,
    baseUrl: context.env.BETTER_AUTH_URL,
    appUrl: context.env.APP_URL,
    turnstileSecretKey: context.env.TURNSTILE_SECRET_KEY,
  });
  context.set("database", database);
  context.set("auditTrail", auditTrail);
  context.set("emailSender", emailSender);
  context.set("auth", auth);
  context.set("session", await auth.api.getSession({ headers: context.req.raw.headers }));
  await next();
});
