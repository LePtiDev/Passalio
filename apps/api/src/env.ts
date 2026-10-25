import type { AuditTrail } from "./platform/audit-trail";
import type { Auth, AuthSession } from "./platform/auth";
import type { Database } from "./platform/database";
import type { EmailDelivery, EmailSender } from "./platform/email";
import type { Logger } from "./platform/logger";

export type Bindings = {
  readonly DB: D1Database;
  readonly FILES: R2Bucket;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly APP_URL: string;
  readonly TURNSTILE_SECRET_KEY: string;
  readonly EMAIL_DELIVERY: EmailDelivery;
  readonly EMAIL_FROM: string;
  readonly RESEND_API_KEY?: string;
  readonly MAIL_SECRET_KEY?: string;
  readonly MCP_ENABLED?: string;
  readonly OAUTH_KV?: KVNamespace;
  readonly PLATE_READER_MODEL?: string;
  readonly PLATE_READER_FALLBACK_MODEL?: string;
  readonly OPENAI_API_KEY?: string;
  readonly GOOGLE_GENERATIVE_AI_API_KEY?: string;
  readonly ANTHROPIC_API_KEY?: string;
  readonly MISTRAL_API_KEY?: string;
  readonly STRIPE_SECRET_KEY?: string;
  readonly STRIPE_WEBHOOK_SECRET?: string;
  readonly STRIPE_PAYMENT_METHOD_CONFIGURATION?: string;
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
