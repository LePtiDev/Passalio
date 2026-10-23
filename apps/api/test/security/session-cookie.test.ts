import { TERMS_VERSION } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import {
  isSignedOut,
  jsonRequest,
  requestInProduction,
  sessionCookieHeader,
} from "./security-fixtures";

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

let platform: TestPlatform;

const signUpInProduction = (email: string) =>
  requestInProduction(
    platform,
    "/api/auth/sign-up/email",
    jsonRequest({ name: "Cookie", email, password: TEST_PASSWORD, termsVersion: TERMS_VERSION }),
  );

const attributesOf = (cookie: string | undefined) =>
  (cookie ?? "")
    .split(";")
    .slice(1)
    .map((attribute) => attribute.trim().toLowerCase());

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("session cookie", () => {
  it("is HttpOnly, Secure and SameSite=Lax in production", async () => {
    const response = await signUpInProduction("cookie-prod@example.fr");
    expect(response.status).toBe(200);
    const attributes = attributesOf(sessionCookieHeader(response));
    expect(attributes).toContain("httponly");
    expect(attributes).toContain("secure");
    expect(attributes).toContain("samesite=lax");
  });

  it("is HttpOnly and SameSite=Lax on a password sign-in", async () => {
    await platform.signIn("cookie-connexion@example.fr");
    const response = await platform.request(
      "/api/auth/sign-in/email",
      jsonRequest({ email: "cookie-connexion@example.fr", password: TEST_PASSWORD }),
    );
    const attributes = attributesOf(sessionCookieHeader(response));
    expect(attributes).toContain("httponly");
    expect(attributes).toContain("samesite=lax");
  });

  it("expires after 30 days", async () => {
    const response = await signUpInProduction("cookie-duree@example.fr");
    expect(attributesOf(sessionCookieHeader(response))).toContain(
      `max-age=${THIRTY_DAYS_IN_SECONDS}`,
    );
  });

  it("can be revoked", async () => {
    const cookie = await platform.signIn("cookie-revoque@example.fr");
    const session = await platform.request("/api/auth/get-session", {}, cookie);
    const token = decodeURIComponent(cookie.split("=")[1] ?? "").split(".")[0];
    expect(session.status).toBe(200);
    const revoked = await platform.request(
      "/api/auth/revoke-session",
      jsonRequest({ token }),
      cookie,
    );
    expect(revoked.status).toBe(200);
    expect(await isSignedOut(platform, cookie)).toBe(true);
  });
});
