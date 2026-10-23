import { TERMS_VERSION } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { jsonRequest } from "./security-fixtures";

let platform: TestPlatform;

const PROTECTED_REQUESTS = [
  {
    path: "/api/auth/sign-up/email",
    body: {
      name: "Robot",
      email: "robot-inscription@example.fr",
      password: TEST_PASSWORD,
      termsVersion: TERMS_VERSION,
    },
  },
  {
    path: "/api/auth/sign-in/email",
    body: { email: "turnstile@example.fr", password: TEST_PASSWORD },
  },
  {
    path: "/api/auth/request-password-reset",
    body: { email: "turnstile@example.fr", redirectTo: `${APP_URL}/mot-de-passe/nouveau` },
  },
] as const;

const sendWithCaptcha = (path: string, body: unknown, captchaToken: string) =>
  platform.request(path, {
    ...jsonRequest(body),
    headers: { "x-captcha-response": captchaToken },
  });

beforeAll(async () => {
  platform = await startTestPlatform();
  await platform.signIn("turnstile@example.fr");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("Turnstile on sign-up, password sign-in and forgotten password", () => {
  it.each(PROTECTED_REQUESTS)("answers 400 to $path without a token", async ({ path, body }) => {
    const response = await sendWithCaptcha(path, body, "");
    expect(response.status).toBe(400);
  });

  it.each(PROTECTED_REQUESTS)(
    "answers 403 to $path when Cloudflare refuses the token",
    async ({ path, body }) => {
      const response = await sendWithCaptcha(path, body, "jeton-refuse");
      expect(response.status).toBe(403);
    },
  );

  it("answers 500 when Cloudflare does not answer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("network down"));
    const response = await sendWithCaptcha(
      "/api/auth/sign-in/email",
      { email: "turnstile@example.fr", password: TEST_PASSWORD },
      "jeton-sans-reponse",
    );
    expect(response.status).toBe(500);
  });

  it("does not ask a token for a magic link", async () => {
    const response = await sendWithCaptcha(
      "/api/auth/sign-in/magic-link",
      { email: "turnstile@example.fr", callbackURL: APP_URL },
      "",
    );
    expect(response.status).toBe(200);
  });
});
