import { TERMS_VERSION } from "@passalio/shared";
import { createActivityLog } from "../../src/platform/activity-log";
import { createAuditTrail } from "../../src/platform/audit-trail";
import { createAuth } from "../../src/platform/auth";
import type { Database } from "../../src/platform/database";
import { createEmailSender } from "../../src/platform/email";
import { createLogger } from "../../src/platform/logger";

const APP_URL = "http://localhost:5173";
const SESSION_COOKIE = "better-auth.session_token=";
const PASSWORD = "mot-de-passe-de-test";

const authOn = (database: Database, traceId: string) =>
  createAuth({
    database,
    signUpGate: { canSignUp: async () => true },
    emailSender: createEmailSender(
      {
        delivery: "disabled",
        resendApiKey: undefined,
        from: "Passalio <test@passalio.com>",
        assetsUrl: APP_URL,
      },
      createLogger(traceId),
    ),
    auditTrail: createAuditTrail(database, traceId),
    activityLog: createActivityLog(database),
    secret: "test-secret-that-is-long-enough-for-better-auth",
    baseUrl: "http://localhost:8787",
    appUrl: APP_URL,
    turnstileSecretKey: "test-turnstile-secret",
  });

export const createAuthSessions = (database: Database, traceId: string) => {
  const auth = authOn(database, traceId);
  return {
    getSession: (cookie: string) => auth.api.getSession({ headers: new Headers({ cookie }) }),
  };
};

export const signUp = async (database: Database, traceId: string, email: string) => {
  const { headers } = await authOn(database, traceId).api.signUpEmail({
    body: { email, password: PASSWORD, name: "Nadia Roux", termsVersion: TERMS_VERSION },
    returnHeaders: true,
  });
  return (
    headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(SESSION_COOKIE))
      ?.split(";")[0] ?? ""
  );
};
