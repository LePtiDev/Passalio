import { teamResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enableTwoFactor, signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { totpCode } from "../totp";
import {
  fromAddress,
  isSignedOut,
  jsonRequest,
  statusesOfSequentialAttempts,
} from "./security-fixtures";

let platform: TestPlatform;
let superadmin: string;
let bystander: string;

const userIdOf = async (email: string) => {
  const response = await platform.request("/api/admin/team", {}, superadmin);
  return (
    teamResponse.parse(await response.json()).members.find((member) => member.email === email)
      ?.id ?? ""
  );
};

const verifyFrom = (path: string, ipAddress: string, cookie: string, body: unknown) =>
  platform.request(
    `/api/auth/two-factor/${path}`,
    { ...jsonRequest(body), headers: fromAddress(ipAddress) },
    cookie,
  );

beforeAll(async () => {
  platform = await startTestPlatform();
  superadmin = await signInAsAdmin(platform, "chef-portee@passalio.com");
  bystander = await signInAsAdmin(platform, "temoin@passalio.com", "admin");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("platform role changes close only the sessions of that person", () => {
  it("keeps the other sessions open after a role change", async () => {
    await signInAsAdmin(platform, "change-portee@passalio.com", "sales");
    const userId = await userIdOf("change-portee@passalio.com");
    const changed = await platform.request(
      `/api/admin/team/members/${userId}`,
      jsonRequest({ role: "admin" }, "PATCH"),
      superadmin,
    );
    expect(changed.status).toBe(200);
    expect(await isSignedOut(platform, superadmin)).toBe(false);
    expect(await isSignedOut(platform, bystander)).toBe(false);
  });

  it("keeps the other sessions open after a removal", async () => {
    await signInAsAdmin(platform, "retrait-portee@passalio.com", "admin");
    const userId = await userIdOf("retrait-portee@passalio.com");
    const removed = await platform.request(
      `/api/admin/team/members/${userId}`,
      { method: "DELETE" },
      superadmin,
    );
    expect(removed.status).toBe(204);
    expect(await isSignedOut(platform, superadmin)).toBe(false);
    expect(await isSignedOut(platform, bystander)).toBe(false);
  });

  it("does not close the sessions when the role change is refused", async () => {
    const target = await signInAsAdmin(platform, "refus-portee@passalio.com", "sales");
    const userId = await userIdOf("refus-portee@passalio.com");
    const refused = await platform.request(
      `/api/admin/team/members/${userId}`,
      jsonRequest({ role: "admin" }, "PATCH"),
      bystander,
    );
    expect([403, 404]).toContain(refused.status);
    expect(await isSignedOut(platform, target)).toBe(false);
  });
});

describe("two-factor code checks are limited to 5 per minute", () => {
  it("refuses even the right code once the limit is reached", async () => {
    const { cookie, secret } = await enableTwoFactor(
      platform,
      await platform.signIn("code-juste@passalio.com"),
    );
    await statusesOfSequentialAttempts(5, () =>
      verifyFrom("verify-totp", "203.0.113.70", cookie, { code: "000000" }),
    );
    const response = await verifyFrom("verify-totp", "203.0.113.70", cookie, {
      code: await totpCode(secret),
    });
    expect(response.status).toBe(429);
  });

  it("limits backup code checks to 5 per minute too", async () => {
    const { cookie } = await enableTwoFactor(
      platform,
      await platform.signIn("code-secours@passalio.com"),
    );
    const statuses = await statusesOfSequentialAttempts(6, () =>
      verifyFrom("verify-backup-code", "203.0.113.71", cookie, { code: "AAAAA-BBBBB" }),
    );
    expect(statuses.slice(0, 5).includes(429)).toBe(false);
    expect(statuses[5]).toBe(429);
  });
});
