import { verifications } from "@passalio/db";
import { like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { APP_URL, startTestPlatform, type TestPlatform } from "../test-platform";
import { jsonRequest } from "./security-fixtures";

let platform: TestPlatform;

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("password reset token storage", () => {
  it("stores the password reset token hashed", async () => {
    await platform.signIn("jeton-hache@example.fr");
    await platform.request(
      "/api/auth/request-password-reset",
      jsonRequest({
        email: "jeton-hache@example.fr",
        redirectTo: `${APP_URL}/mot-de-passe/nouveau`,
      }),
    );
    const token = new URL(platform.lastLoggedUrl()).pathname.split("/").at(-1) ?? "";
    expect(token.length).toBeGreaterThan(10);
    const stored = await createDatabase(platform.env.DB)
      .select({ identifier: verifications.identifier })
      .from(verifications)
      .where(like(verifications.identifier, `%${token}%`));
    expect(stored).toEqual([]);
  });
});
