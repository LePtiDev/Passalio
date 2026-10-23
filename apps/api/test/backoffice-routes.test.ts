import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, TEST_PASSWORD, type TestPlatform } from "./test-platform";
import { enableTwoFactor as enableTwoFactorOf, grantPlatformRole } from "./admin-session";
import { totpCode } from "./totp";

const errorResponse = z.object({ error: z.string(), traceId: z.string() });
const adminResponse = z.object({
  admin: z.object({ userId: z.string(), email: z.string(), role: z.string() }),
});
const twoFactorRedirect = z.object({ twoFactorRedirect: z.literal(true) });

let platform: TestPlatform;

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

const grantRole = (email: string, role: "superadmin" | "support") =>
  grantPlatformRole(platform, email, role);

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

const enableTwoFactor = (cookie: string) => enableTwoFactorOf(platform, cookie);

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("admin space access", () => {
  it("answers not found to a signed-out visitor", async () => {
    const response = await platform.request("/api/admin/me");
    expect(response.status).toBe(404);
  });

  it("answers not found to a regular user", async () => {
    const cookie = await platform.signIn("ramoneur@example.fr");
    const response = await platform.request("/api/admin/me", {}, cookie);
    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("not_found");
  });

  it("asks an admin to enable two-factor first", async () => {
    const cookie = await platform.signIn("support@passalio.com");
    await grantRole("support@passalio.com", "support");
    const response = await platform.request("/api/admin/me", {}, cookie);
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("two_factor_required");
  });

  it("opens the admin space once two-factor is enabled", async () => {
    const signedUp = await platform.signIn("quentin@passalio.com");
    await grantRole("quentin@passalio.com", "superadmin");
    const { cookie } = await enableTwoFactor(signedUp);
    const response = await platform.request("/api/admin/me", {}, cookie);
    expect(response.status).toBe(200);
    expect(adminResponse.parse(await response.json()).admin).toMatchObject({
      email: "quentin@passalio.com",
      role: "superadmin",
    });
  });

  it("requires the code at the next sign-in, then opens the admin space", async () => {
    const email = "antho@passalio.com";
    const { secret } = await enableTwoFactor(await platform.signIn(email));
    await grantRole(email, "support");
    const signedIn = await platform.request(
      "/api/auth/sign-in/email",
      json({ email, password: TEST_PASSWORD }),
    );
    expect(twoFactorRedirect.safeParse(await signedIn.json()).success).toBe(true);
    const pendingCookie = signedIn.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0] ?? "")
      .join("; ");
    const withoutCode = await platform.request("/api/admin/me", {}, pendingCookie);
    expect(withoutCode.status).toBe(404);
    const verified = await platform.request(
      "/api/auth/two-factor/verify-totp",
      json({ code: await totpCode(secret) }),
      pendingCookie,
    );
    expect(verified.status).toBe(200);
    const withCode = await platform.request(
      "/api/admin/me",
      {},
      platform.sessionCookieOf(verified),
    );
    expect(withCode.status).toBe(200);
  });

  it("refuses a wrong code", async () => {
    const signedUp = await platform.signIn("mauvais-code@passalio.com");
    const enabled = await platform.request(
      "/api/auth/two-factor/enable",
      json({ password: TEST_PASSWORD }),
      signedUp,
    );
    expect(enabled.status).toBe(200);
    const verified = await platform.request(
      "/api/auth/two-factor/verify-totp",
      json({ code: "000000" }),
      signedUp,
    );
    expect(verified.status).toBe(401);
  });

  it("keeps the plugin's admin endpoints closed", async () => {
    const signedUp = await platform.signIn("ramoneur@example.fr");
    const response = await platform.request(
      "/api/auth/admin/set-role",
      json({ userId: "x", role: "superadmin" }),
      signedUp,
    );
    expect(response.status).toBe(404);
  });
});
