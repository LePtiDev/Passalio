import { rateLimits, users } from "@passalio/db";
import { TERMS_VERSION } from "@passalio/shared";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { fromAddress, jsonRequest, statusesOfSequentialAttempts } from "./security-fixtures";

const ONE_MINUTE_AND_A_BIT_IN_MILLISECONDS = 61_000;

let platform: TestPlatform;

const signInFrom = (ipAddress: string, email: string, password: string) =>
  platform.request("/api/auth/sign-in/email", {
    ...jsonRequest({ email, password }),
    headers: fromAddress(ipAddress),
  });

const signUpFrom = (ipAddress: string, email: string) =>
  platform.request("/api/auth/sign-up/email", {
    ...jsonRequest({
      name: "Fenetre",
      email,
      password: TEST_PASSWORD,
      termsVersion: TERMS_VERSION,
    }),
    headers: fromAddress(ipAddress),
  });

const moveCountersOfAddressBack = (ipAddress: string, milliseconds: number) =>
  createDatabase(platform.env.DB)
    .update(rateLimits)
    .set({ lastRequest: Date.now() - milliseconds })
    .where(like(rateLimits.key, `%${ipAddress}%`));

const userExists = async (email: string) =>
  (
    await createDatabase(platform.env.DB)
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
  ).length > 0;

beforeAll(async () => {
  platform = await startTestPlatform();
  await platform.signIn("fenetre@example.fr");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("authentication rate limits", () => {
  it("counts sign-in attempts per address whatever the email", async () => {
    const statuses = await statusesOfSequentialAttempts(11, (index) =>
      signInFrom("203.0.113.60", `inconnu-${index}@example.fr`, "mauvais-mot-de-passe"),
    );
    expect(statuses.slice(0, 10).includes(429)).toBe(false);
    expect(statuses[10]).toBe(429);
  });

  it("refuses even the right password once the address is limited", async () => {
    await statusesOfSequentialAttempts(10, () =>
      signInFrom("203.0.113.61", "fenetre@example.fr", "mauvais-mot-de-passe"),
    );
    const response = await signInFrom("203.0.113.61", "fenetre@example.fr", TEST_PASSWORD);
    expect(response.status).toBe(429);
    expect(platform.sessionCookieOf(response)).toBe("");
  });

  it("creates no account once sign-ups from the address are limited", async () => {
    await statusesOfSequentialAttempts(5, (index) =>
      signUpFrom("203.0.113.62", `fenetre-inscription-${index}@example.fr`),
    );
    const response = await signUpFrom("203.0.113.62", "fenetre-de-trop@example.fr");
    expect(response.status).toBe(429);
    expect(await userExists("fenetre-de-trop@example.fr")).toBe(false);
  });

  it("lets the address try again once the minute has passed", async () => {
    await statusesOfSequentialAttempts(11, () =>
      signInFrom("203.0.113.63", "fenetre@example.fr", "mauvais-mot-de-passe"),
    );
    await moveCountersOfAddressBack("203.0.113.63", ONE_MINUTE_AND_A_BIT_IN_MILLISECONDS);
    const response = await signInFrom("203.0.113.63", "fenetre@example.fr", TEST_PASSWORD);
    expect(response.status).toBe(200);
  });

  it("keeps the address limited within the minute", async () => {
    await statusesOfSequentialAttempts(11, () =>
      signInFrom("203.0.113.64", "fenetre@example.fr", "mauvais-mot-de-passe"),
    );
    await moveCountersOfAddressBack("203.0.113.64", 30_000);
    const response = await signInFrom("203.0.113.64", "fenetre@example.fr", TEST_PASSWORD);
    expect(response.status).toBe(429);
  });
});
