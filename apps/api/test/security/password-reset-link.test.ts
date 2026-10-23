import { verifications } from "@passalio/db";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { jsonRequest } from "./security-fixtures";

const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const TOLERANCE_IN_MILLISECONDS = 5_000;

let platform: TestPlatform;

const requestResetToken = async (email: string) => {
  await platform.signIn(email);
  await platform.request(
    "/api/auth/request-password-reset",
    jsonRequest({ email, redirectTo: `${APP_URL}/mot-de-passe/nouveau` }),
  );
  return new URL(platform.lastLoggedUrl()).pathname.split("/").at(-1) ?? "";
};

const resetPassword = (token: string, newPassword: string) =>
  platform.request("/api/auth/reset-password", jsonRequest({ token, newPassword }));

const signInWith = (email: string, password: string) =>
  platform.request("/api/auth/sign-in/email", jsonRequest({ email, password }));

const resetVerificationOf = (token: string) =>
  createDatabase(platform.env.DB)
    .select({
      id: verifications.id,
      createdAt: verifications.createdAt,
      expiresAt: verifications.expiresAt,
    })
    .from(verifications)
    .where(like(verifications.identifier, `%${token}%`));

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("password reset link", () => {
  it("works only once", async () => {
    const token = await requestResetToken("usage-unique@example.fr");
    expect((await resetPassword(token, "premier-nouveau-2026")).status).toBe(200);
    expect((await resetPassword(token, "second-nouveau-2026")).status).toBe(400);
    expect((await signInWith("usage-unique@example.fr", "second-nouveau-2026")).status).toBe(401);
  });

  it("expires one hour after it was sent", async () => {
    const token = await requestResetToken("une-heure@example.fr");
    const [verification] = await resetVerificationOf(token);
    const lifetime =
      (verification?.expiresAt.getTime() ?? 0) - (verification?.createdAt.getTime() ?? 0);
    expect(Math.abs(lifetime - ONE_HOUR_IN_MILLISECONDS)).toBeLessThan(TOLERANCE_IN_MILLISECONDS);
  });

  it("is refused once expired", async () => {
    const token = await requestResetToken("expire@example.fr");
    const [verification] = await resetVerificationOf(token);
    await createDatabase(platform.env.DB)
      .update(verifications)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(verifications.id, verification?.id ?? ""));
    expect((await resetPassword(token, "trop-tard-2026-reset")).status).toBe(400);
    expect((await signInWith("expire@example.fr", TEST_PASSWORD)).status).toBe(200);
  });
});
