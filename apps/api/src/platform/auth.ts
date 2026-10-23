import { schema } from "@passalio/db";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, newId, TERMS_VERSION } from "@passalio/shared";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, captcha, magicLink, organization, twoFactor } from "better-auth/plugins";
import type { ActivityLog } from "./activity-log";
import type { AuditTrail } from "./audit-trail";
import type { Database } from "./database";
import type { EmailSender } from "./email";
import { PLATFORM_ROLES } from "./platform-roles";

export const AUTH_BASE_PATH = "/api/auth";

const MINUTE_IN_SECONDS = 60;
const DAY_IN_SECONDS = 24 * 60 * MINUTE_IN_SECONDS;

export const MAGIC_LINK_LIFETIME_SECONDS = 15 * MINUTE_IN_SECONDS;
export const IMPERSONATION_LIFETIME_SECONDS = 30 * MINUTE_IN_SECONDS;
export const PASSWORD_RESET_LIFETIME_SECONDS = 60 * MINUTE_IN_SECONDS;
export const TWO_FACTOR_BACKUP_CODE_COUNT = 10;

const RATE_LIMIT_RULES = {
  "/get-session": false,
  "/sign-in/email": { window: MINUTE_IN_SECONDS, max: 10 },
  "/sign-up/email": { window: MINUTE_IN_SECONDS, max: 5 },
  "/sign-in/magic-link": { window: MINUTE_IN_SECONDS, max: 5 },
  "/request-password-reset": { window: MINUTE_IN_SECONDS, max: 3 },
  "/reset-password": { window: MINUTE_IN_SECONDS, max: 5 },
  "/two-factor/verify-totp": { window: MINUTE_IN_SECONDS, max: 5 },
  "/two-factor/verify-backup-code": { window: MINUTE_IN_SECONDS, max: 5 },
} as const;

export const CAPTCHA_PROTECTED_PATHS = [
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
] as const;

const withAcceptedTerms = <User extends Readonly<Record<string, unknown>>>(user: User) => {
  if (user["termsVersion"] !== TERMS_VERSION) {
    throw new APIError("BAD_REQUEST", { code: "TERMS_NOT_ACCEPTED" });
  }
  return { ...user, termsAcceptedAt: new Date() };
};

export type AuthDependencies = {
  readonly database: Database;
  readonly emailSender: EmailSender;
  readonly auditTrail: AuditTrail;
  readonly activityLog: ActivityLog;
  readonly secret: string;
  readonly baseUrl: string;
  readonly appUrl: string;
  readonly turnstileSecretKey: string;
};

type ActivitySession = {
  readonly userId: string;
  readonly impersonatedBy?: unknown;
};

const activityRecorder =
  (activityLog: ActivityLog) =>
  async ({ userId, impersonatedBy }: ActivitySession): Promise<void> => {
    if (typeof impersonatedBy === "string" && impersonatedBy !== "") {
      return;
    }
    await activityLog.recordDay(userId, new Date());
  };

export const createAuth = ({
  database,
  emailSender,
  auditTrail,
  activityLog,
  secret,
  baseUrl,
  appUrl,
  turnstileSecretKey,
}: AuthDependencies) =>
  betterAuth({
    appName: "Passalio",
    baseURL: baseUrl,
    basePath: AUTH_BASE_PATH,
    secret,
    trustedOrigins: [appUrl],
    telemetry: { enabled: false },
    database: drizzleAdapter(database, { provider: "sqlite", schema, usePlural: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
      autoSignIn: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_LIFETIME_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        emailSender.sendPasswordReset({ email: user.email, url }),
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: RATE_LIMIT_RULES,
    },
    session: {
      expiresIn: 30 * DAY_IN_SECONDS,
      updateAge: DAY_IN_SECONDS,
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      database: { generateId: () => newId() },
    },
    user: {
      additionalFields: {
        termsVersion: { type: "number", required: true, input: true },
        termsAcceptedAt: { type: "date", required: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({ data: withAcceptedTerms(user) }),
        },
      },
      session: {
        create: {
          after: async (session) => {
            await auditTrail.record({
              organizationId: null,
              actorUserId: session.userId,
              action: "session.created",
              targetType: "session",
              targetId: session.id,
            });
            await activityRecorder(activityLog)(session);
          },
        },
        update: {
          after: activityRecorder(activityLog),
        },
      },
    },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: turnstileSecretKey,
        endpoints: [...CAPTCHA_PROTECTED_PATHS],
      }),
      magicLink({
        expiresIn: MAGIC_LINK_LIFETIME_SECONDS,
        storeToken: "hashed",
        disableSignUp: true,
        sendMagicLink: ({ email, url }) => emailSender.sendMagicLink({ email, url }),
      }),
      organization({ creatorRole: "owner" }),
      twoFactor({
        issuer: "Passalio",
        backupCodeOptions: { amount: TWO_FACTOR_BACKUP_CODE_COUNT },
      }),
      admin({
        roles: PLATFORM_ROLES,
        defaultRole: "user",
        adminRoles: ["superadmin", "support"],
        impersonationSessionDuration: IMPERSONATION_LIFETIME_SECONDS,
      }),
    ],
  });

export type Auth = ReturnType<typeof createAuth>;

export type AuthSession = Auth["$Infer"]["Session"];
