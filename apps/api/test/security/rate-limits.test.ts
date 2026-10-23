import { rateLimits } from "@passalio/db";
import { TERMS_VERSION } from "@passalio/shared";
import { like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { createDatabase } from "../../src/platform/database";
import { fromAddress, jsonRequest, statusesOfSequentialAttempts } from "./security-fixtures";

let platform: TestPlatform;

const sendFrom = (ipAddress: string, path: string, body: unknown) =>
  platform.request(path, { ...jsonRequest(body), headers: fromAddress(ipAddress) });

const signUpFrom = (ipAddress: string, email: string) =>
  sendFrom(ipAddress, "/api/auth/sign-up/email", {
    name: "Limite",
    email,
    password: TEST_PASSWORD,
    termsVersion: TERMS_VERSION,
  });

const signInFrom = (ipAddress: string, email: string) =>
  sendFrom(ipAddress, "/api/auth/sign-in/email", { email, password: "mauvais-mot-de-passe" });

const magicLinkFrom = (ipAddress: string, email: string) =>
  sendFrom(ipAddress, "/api/auth/sign-in/magic-link", { email, callbackURL: APP_URL });

const passwordResetFrom = (ipAddress: string, email: string) =>
  sendFrom(ipAddress, "/api/auth/request-password-reset", {
    email,
    redirectTo: `${APP_URL}/mot-de-passe/nouveau`,
  });

beforeAll(async () => {
  platform = await startTestPlatform();
  await platform.signIn("limite@example.fr");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("authentication rate limits per IP address", () => {
  it("allows 10 sign-in attempts per minute, then answers 429", async () => {
    const statuses = await statusesOfSequentialAttempts(11, () =>
      signInFrom("203.0.113.10", "limite@example.fr"),
    );
    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("allows 5 sign-ups per minute, then answers 429", async () => {
    const statuses = await statusesOfSequentialAttempts(6, (index) =>
      signUpFrom("203.0.113.11", `inscription-${index}@example.fr`),
    );
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });

  it("allows 5 magic links per minute, then answers 429", async () => {
    const statuses = await statusesOfSequentialAttempts(6, () =>
      magicLinkFrom("203.0.113.12", "limite@example.fr"),
    );
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });

  it("allows 3 forgotten password requests per minute, then answers 429", async () => {
    const statuses = await statusesOfSequentialAttempts(4, () =>
      passwordResetFrom("203.0.113.13", "limite@example.fr"),
    );
    expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(statuses[3]).toBe(429);
  });

  it("does not block another IP address once one is limited", async () => {
    await statusesOfSequentialAttempts(4, () =>
      passwordResetFrom("203.0.113.14", "limite@example.fr"),
    );
    const blocked = await passwordResetFrom("203.0.113.14", "limite@example.fr");
    const other = await passwordResetFrom("203.0.113.15", "limite@example.fr");
    expect(blocked.status).toBe(429);
    expect(other.status).toBe(200);
  });

  it("keeps the counters in the D1 rate_limits table", async () => {
    await signInFrom("203.0.113.16", "limite@example.fr");
    const counters = await createDatabase(platform.env.DB)
      .select({ key: rateLimits.key })
      .from(rateLimits)
      .where(like(rateLimits.key, "%203.0.113.16%"));
    expect(counters).toHaveLength(1);
  });
});
