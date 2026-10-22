import { schema } from "@passalio/db";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, newId } from "@passalio/shared";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, organization } from "better-auth/plugins";
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

const RATE_LIMIT_RULES = {
  "/get-session": false,
  "/sign-in/email": { window: MINUTE_IN_SECONDS, max: 10 },
  "/sign-up/email": { window: MINUTE_IN_SECONDS, max: 5 },
  "/sign-in/magic-link": { window: MINUTE_IN_SECONDS, max: 5 },
  "/request-password-reset": { window: MINUTE_IN_SECONDS, max: 3 },
  "/reset-password": { window: MINUTE_IN_SECONDS, max: 5 },
} as const;

type PasswordResetRequest = {
  readonly user: { readonly email: string };
  readonly url: string;
};

export type AuthDependencies = {
  readonly database: Database;
  readonly emailSender: EmailSender;
  readonly auditTrail: AuditTrail;
  readonly secret: string;
  readonly baseUrl: string;
  readonly appUrl: string;
};

export const createAuth = ({
  database,
  emailSender,
  auditTrail,
  secret,
  baseUrl,
  appUrl,
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
    databaseHooks: {
      emailAndPassword: {
        enabled: true,
        minPasswordLength: MIN_PASSWORD_LENGTH,
        maxPasswordLength: MAX_PASSWORD_LENGTH,
        autoSignIn: true,
        requireEmailVerification: false,
        resetPasswordTokenExpiresIn: PASSWORD_RESET_LIFETIME_SECONDS,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: ({ user, url }: PasswordResetRequest) =>
          emailSender.sendPasswordReset({ email: user.email, url }),
      },
      rateLimit: {
        enabled: true,
        storage: "database",
        customRules: RATE_LIMIT_RULES,
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
          },
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_LIFETIME_SECONDS,
        storeToken: "hashed",
        disableSignUp: true,
        sendMagicLink: ({ email, url }) => emailSender.sendMagicLink({ email, url }),
      }),
      organization({ creatorRole: "owner" }),
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
