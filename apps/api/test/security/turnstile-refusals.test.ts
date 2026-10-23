import { users } from "@passalio/db";
import { TERMS_VERSION } from "@passalio/shared";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { jsonRequest } from "./security-fixtures";

const REFUSED_TOKENS = [
  ["missing", "", 400],
  ["refused", "jeton-refuse", 403],
] as const;

let platform: TestPlatform;

const sendWithCaptcha = (path: string, body: unknown, captchaToken: string) =>
  platform.request(path, {
    ...jsonRequest(body),
    headers: { "x-captcha-response": captchaToken },
  });

const userExists = async (email: string) =>
  (
    await createDatabase(platform.env.DB)
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
  ).length > 0;

const emailCount = () =>
  platform.loggedLines().filter((line) => line.includes('"event":"email_logged"')).length;

beforeAll(async () => {
  platform = await startTestPlatform();
  await platform.signIn("turnstile-effets@example.fr");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("a sign-up without a valid Turnstile token", () => {
  it.each(REFUSED_TOKENS)(
    "creates no account when the token is %s",
    async (kind, token, status) => {
      const email = `robot-${kind}@example.fr`;
      const response = await sendWithCaptcha(
        "/api/auth/sign-up/email",
        { name: "Robot", email, password: TEST_PASSWORD, termsVersion: TERMS_VERSION },
        token,
      );
      expect(response.status).toBe(status);
      expect(platform.sessionCookieOf(response)).toBe("");
      expect(await userExists(email)).toBe(false);
    },
  );
});

describe("a password sign-in without a valid Turnstile token", () => {
  it.each(REFUSED_TOKENS)(
    "opens no session even with the right password when the token is %s",
    async (_kind, token, status) => {
      const response = await sendWithCaptcha(
        "/api/auth/sign-in/email",
        { email: "turnstile-effets@example.fr", password: TEST_PASSWORD },
        token,
      );
      expect(response.status).toBe(status);
      expect(platform.sessionCookieOf(response)).toBe("");
    },
  );
});

describe("a forgotten password request without a valid Turnstile token", () => {
  it.each(REFUSED_TOKENS)("sends no email when the token is %s", async (_kind, token, status) => {
    const before = emailCount();
    const response = await sendWithCaptcha(
      "/api/auth/request-password-reset",
      { email: "turnstile-effets@example.fr", redirectTo: `${APP_URL}/mot-de-passe/nouveau` },
      token,
    );
    expect(response.status).toBe(status);
    expect(emailCount()).toBe(before);
  });
});
