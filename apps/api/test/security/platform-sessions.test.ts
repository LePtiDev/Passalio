import { teamResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enableTwoFactor, signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import {
  fromAddress,
  isSignedOut,
  jsonRequest,
  statusesOfSequentialAttempts,
} from "./security-fixtures";

let platform: TestPlatform;
let superadmin: string;

const userIdOf = async (email: string) => {
  const response = await platform.request("/api/admin/team", {}, superadmin);
  return (
    teamResponse.parse(await response.json()).members.find((member) => member.email === email)
      ?.id ?? ""
  );
};

const verifyTotpFrom = (ipAddress: string, cookie: string, code: string) =>
  platform.request(
    "/api/auth/two-factor/verify-totp",
    { ...jsonRequest({ code }), headers: fromAddress(ipAddress) },
    cookie,
  );

beforeAll(async () => {
  platform = await startTestPlatform();
  superadmin = await signInAsAdmin(platform, "chef@passalio.com");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("platform role sessions", () => {
  it("closes the sessions of a person whose platform role changes", async () => {
    const session = await signInAsAdmin(platform, "change-role@passalio.com", "sales");
    const userId = await userIdOf("change-role@passalio.com");
    expect(await isSignedOut(platform, session)).toBe(false);
    const changed = await platform.request(
      `/api/admin/team/members/${userId}`,
      jsonRequest({ role: "admin" }, "PATCH"),
      superadmin,
    );
    expect(changed.status).toBe(200);
    expect(await isSignedOut(platform, session)).toBe(true);
  });

  it("closes the sessions of a person removed from the team", async () => {
    const removed = await signInAsAdmin(platform, "retire@passalio.com", "admin");
    const userId = await userIdOf("retire@passalio.com");
    expect(await isSignedOut(platform, removed)).toBe(false);
    const response = await platform.request(
      `/api/admin/team/members/${userId}`,
      { method: "DELETE" },
      superadmin,
    );
    expect(response.status).toBe(204);
    expect(await isSignedOut(platform, removed)).toBe(true);
  });
});

describe("two-factor code checks", () => {
  it("allows 5 code checks per minute, then answers 429", async () => {
    const { cookie } = await enableTwoFactor(
      platform,
      await platform.signIn("code-limite@passalio.com"),
    );
    const statuses = await statusesOfSequentialAttempts(6, () =>
      verifyTotpFrom("203.0.113.40", cookie, "000000"),
    );
    expect(statuses.slice(0, 5).includes(429)).toBe(false);
    expect(statuses[5]).toBe(429);
  });
});
