import { expect } from "vitest";
import * as z from "zod";
import { TEST_PASSWORD, type TestPlatform } from "./test-platform";
import { secretOfTotpUri, totpCode } from "./totp";

const enableResponse = z.object({ totpURI: z.string(), backupCodes: z.array(z.string()) });

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const grantPlatformRole = async (
  platform: TestPlatform,
  email: string,
  role: "superadmin" | "support",
) => {
  await platform.env.DB.prepare("UPDATE users SET role = ? WHERE email = ?")
    .bind(role, email)
    .run();
};

export const enableTwoFactor = async (platform: TestPlatform, cookie: string) => {
  const enabled = await platform.request(
    "/api/auth/two-factor/enable",
    json({ password: TEST_PASSWORD }),
    cookie,
  );
  expect(enabled.status).toBe(200);
  const { totpURI, backupCodes } = enableResponse.parse(await enabled.json());
  const secret = secretOfTotpUri(totpURI);
  const verified = await platform.request(
    "/api/auth/two-factor/verify-totp",
    json({ code: await totpCode(secret) }),
    cookie,
  );
  expect(verified.status).toBe(200);
  return { secret, backupCodes, cookie: platform.sessionCookieOf(verified) || cookie };
};

export const signInAsAdmin = async (platform: TestPlatform, email: string) => {
  const { cookie } = await enableTwoFactor(platform, await platform.signIn(email));
  await grantPlatformRole(platform, email, "superadmin");
  return cookie;
};
