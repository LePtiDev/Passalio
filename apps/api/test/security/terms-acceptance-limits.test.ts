import { users } from "@passalio/db";
import { TERMS_VERSION } from "@passalio/shared";
import { and, eq, lt } from "drizzle-orm";
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

const usersWithEmail = (email: string) =>
  createDatabase(platform.env.DB)
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("terms version at sign-up, invalid values", () => {
  it("creates no account for a future terms version", async () => {
    const response = await signUp("future-sans-compte@example.fr", {
      termsVersion: TERMS_VERSION + 1,
    });
    expect(response.status).toBe(400);
    expect(platform.sessionCookieOf(response)).toBe("");
    expect(await usersWithEmail("future-sans-compte@example.fr")).toEqual([]);
  });

  it.each([
    ["a string", "chaine", String(TERMS_VERSION)],
    ["null", "nulle", null],
    ["a boolean", "booleen", true],
    ["a decimal", "decimale", TERMS_VERSION + 0.5],
  ])("refuses a terms version given as %s and creates no account", async (_kind, slug, value) => {
    const email = `version-${slug}@example.fr`;
    const response = await signUp(email, { termsVersion: value });
    expect(response.status).toBe(400);
    expect(await usersWithEmail(email)).toEqual([]);
  });

  it("never keeps an acceptance date sent by the browser", async () => {
    const before = new Date(Date.now() - 1000);
    await signUp("date-imposee@example.fr", {
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: "2001-01-01T00:00:00.000Z",
    });
    const backdated = await createDatabase(platform.env.DB)
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, "date-imposee@example.fr"), lt(users.termsAcceptedAt, before)));
    expect(backdated).toEqual([]);
  });
});
