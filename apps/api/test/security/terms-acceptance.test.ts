import { users } from "@passalio/db";
import { TERMS_VERSION } from "@passalio/shared";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { jsonRequest } from "./security-fixtures";

let platform: TestPlatform;

const signUp = (email: string, terms: Record<string, unknown>) =>
  platform.request(
    "/api/auth/sign-up/email",
    jsonRequest({ name: "Conditions", email, password: TEST_PASSWORD, ...terms }),
  );

const storedUser = async (email: string) => {
  const [user] = await createDatabase(platform.env.DB)
    .select({ termsVersion: users.termsVersion, termsAcceptedAt: users.termsAcceptedAt })
    .from(users)
    .where(eq(users.email, email));
  return user;
};

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("terms version at sign-up", () => {
  it("refuses a sign-up without a terms version and creates no account", async () => {
    const response = await signUp("sans-version@example.fr", {});
    expect(response.status).toBe(400);
    expect(await storedUser("sans-version@example.fr")).toBeUndefined();
  });

  it("refuses a sign-up with an outdated terms version and creates no account", async () => {
    const response = await signUp("ancienne-version@example.fr", {
      termsVersion: TERMS_VERSION - 1,
    });
    expect(response.status).toBe(400);
    expect(await storedUser("ancienne-version@example.fr")).toBeUndefined();
  });

  it("refuses a sign-up with a future terms version", async () => {
    const response = await signUp("version-future@example.fr", {
      termsVersion: TERMS_VERSION + 1,
    });
    expect(response.status).toBe(400);
  });

  it("stores the current terms version and the acceptance date on the user", async () => {
    const before = Date.now();
    const response = await signUp("version-courante@example.fr", { termsVersion: TERMS_VERSION });
    expect(response.status).toBe(200);
    const user = await storedUser("version-courante@example.fr");
    expect(user?.termsVersion).toBe(TERMS_VERSION);
    expect(user?.termsAcceptedAt?.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });
});
