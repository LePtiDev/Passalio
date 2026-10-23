import type { AuditTrail } from "./platform/audit-trail";
import type { Auth, AuthSession } from "./platform/auth";
import type { Database } from "./platform/database";
import type { EmailSender } from "./platform/email";
import type { Logger } from "./platform/logger";

export type Bindings = {
  readonly DB: D1Database;
  readonly FILES: R2Bucket;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly APP_URL: string;
  readonly TURNSTILE_SECRET_KEY: string;
  readonly EMAIL_DELIVERY: "log" | "disabled";
};

export type Variables = {
  readonly traceId: string;
  readonly logger: Logger;
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly emailSender: EmailSender;
  readonly auth: Auth;
  readonly session: AuthSession | null;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
