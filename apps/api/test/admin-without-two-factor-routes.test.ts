import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { enableTwoFactor, grantPlatformRole } from "./admin-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const errorResponse = z.object({ error: z.string(), traceId: z.string() });
const adminResponse = z.object({
  admin: z.object({ userId: z.string(), email: z.string(), role: z.string() }),
});

let platform: TestPlatform;

const requestWithoutTwoFactor = async (path: string, cookie?: string) => {
  const { app } = await import("../src/app");
  const env = { ...platform.env, ADMIN_TWO_FACTOR_REQUIRED: "false" };
  const headers = new Headers({ origin: env.APP_URL });
  if (cookie !== undefined) {
    headers.set("cookie", cookie);
  }
  return app.request(path, { headers }, env);
};

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("admin space when two-factor is not required", () => {
  it("opens the admin space to an admin who never enabled two-factor", async () => {
    const email = "sans-2fa@passalio.com";
    const cookie = await platform.signIn(email);
    await grantPlatformRole(platform, email, "superadmin");
    const response = await requestWithoutTwoFactor("/api/admin/me", cookie);
    expect(response.status).toBe(200);
    expect(adminResponse.parse(await response.json()).admin).toMatchObject({
      email,
      role: "superadmin",
    });
  });

  it("opens the admin space after an email link, without the code", async () => {
    const email = "lien-sans-code@passalio.com";
    await enableTwoFactor(platform, await platform.signIn(email));
    await grantPlatformRole(platform, email, "admin");
    const linkCookie = await platform.signInWithMagicLink(email);
    const response = await requestWithoutTwoFactor("/api/admin/me", linkCookie);
    expect(response.status).toBe(200);
  });

  it("still answers not found to a regular user", async () => {
    const cookie = await platform.signIn("client-sans-2fa@example.fr");
    const response = await requestWithoutTwoFactor("/api/admin/me", cookie);
    expect(response.status).toBe(404);
    expect(errorResponse.parse(await response.json()).error).toBe("not_found");
  });

  it("still answers not found to a signed-out visitor", async () => {
    const response = await requestWithoutTwoFactor("/api/admin/me");
    expect(response.status).toBe(404);
  });

  it("keeps requiring two-factor when the setting is absent", async () => {
    const email = "toujours-2fa@passalio.com";
    const cookie = await platform.signIn(email);
    await grantPlatformRole(platform, email, "superadmin");
    const response = await platform.request("/api/admin/me", {}, cookie);
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("two_factor_required");
  });
});
