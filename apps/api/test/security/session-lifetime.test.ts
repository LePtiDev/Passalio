import { sessions, verifications } from "@passalio/db";
import { desc, eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { sessionTokenOf } from "./organization-members";
import {
  isSignedOut,
  jsonRequest,
  requestInProduction,
  sessionCookieHeader,
} from "./security-fixtures";

const FIFTEEN_MINUTES_IN_MILLISECONDS = 15 * 60 * 1000;
const TOLERANCE_IN_MILLISECONDS = 5_000;

let platform: TestPlatform;

const attributesOf = (cookie: string | undefined) =>
  (cookie ?? "")
    .split(";")
    .slice(1)
    .map((attribute) => attribute.trim().toLowerCase());

const requestMagicLink = async (email: string) => {
  await platform.request(
    "/api/auth/sign-in/magic-link",
    jsonRequest({ email, callbackURL: APP_URL }),
  );
  return new URL(platform.lastLoggedUrl());
};

const latestVerification = async () => {
  const [verification] = await createDatabase(platform.env.DB)
    .select({
      id: verifications.id,
      createdAt: verifications.createdAt,
      expiresAt: verifications.expiresAt,
    })
    .from(verifications)
    .orderBy(desc(verifications.createdAt))
    .limit(1);
  return verification;
};

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("session lifetime", () => {
  it("ends a session whose expiry date has passed", async () => {
    const cookie = await platform.signIn("session-expiree@example.fr");
    expect(await isSignedOut(platform, cookie)).toBe(false);
    await createDatabase(platform.env.DB)
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.token, sessionTokenOf(cookie)));
    expect(await isSignedOut(platform, cookie)).toBe(true);
    expect((await platform.request("/api/members", {}, cookie)).status).toBe(401);
  });

  it("ends the session on sign-out", async () => {
    const cookie = await platform.signIn("deconnexion@example.fr");
    const signedOut = await platform.request("/api/auth/sign-out", { method: "POST" }, cookie);
    expect(signedOut.status).toBe(200);
    expect(await isSignedOut(platform, cookie)).toBe(true);
  });

  it("revokes only the chosen session", async () => {
    const first = await platform.signIn("deux-sessions@example.fr");
    const second = await platform.signIn("deux-sessions@example.fr");
    const revoked = await platform.request(
      "/api/auth/revoke-session",
      jsonRequest({ token: sessionTokenOf(first) }),
      second,
    );
    expect(revoked.status).toBe(200);
    expect(await isSignedOut(platform, first)).toBe(true);
    expect(await isSignedOut(platform, second)).toBe(false);
  });

  it("sets a Secure, HttpOnly, SameSite=Lax cookie on a password sign-in in production", async () => {
    await platform.signIn("connexion-prod@example.fr");
    const response = await requestInProduction(
      platform,
      "/api/auth/sign-in/email",
      jsonRequest({ email: "connexion-prod@example.fr", password: TEST_PASSWORD }),
    );
    expect(response.status).toBe(200);
    const attributes = attributesOf(sessionCookieHeader(response));
    expect(attributes).toContain("secure");
    expect(attributes).toContain("httponly");
    expect(attributes).toContain("samesite=lax");
  });

  it("refuses a session cookie sent without its signature", async () => {
    const cookie = await platform.signIn("cookie-sans-signature@example.fr");
    const unsigned = `better-auth.session_token=${sessionTokenOf(cookie)}`;
    expect(await isSignedOut(platform, unsigned)).toBe(true);
  });
});

describe("magic link", () => {
  it("expires 15 minutes after it was sent", async () => {
    await platform.signIn("lien-quinze@example.fr");
    await requestMagicLink("lien-quinze@example.fr");
    const verification = await latestVerification();
    const lifetime =
      (verification?.expiresAt.getTime() ?? 0) - (verification?.createdAt.getTime() ?? 0);
    expect(Math.abs(lifetime - FIFTEEN_MINUTES_IN_MILLISECONDS)).toBeLessThan(
      TOLERANCE_IN_MILLISECONDS,
    );
  });

  it("stores its token hashed", async () => {
    await platform.signIn("lien-hache@example.fr");
    const link = await requestMagicLink("lien-hache@example.fr");
    const token = link.searchParams.get("token") ?? "";
    expect(token).not.toBe("");
    const stored = await createDatabase(platform.env.DB)
      .select({ id: verifications.id })
      .from(verifications)
      .where(like(verifications.identifier, `%${token}%`));
    expect(stored).toEqual([]);
  });

  it("is refused once expired", async () => {
    await platform.signIn("lien-perime@example.fr");
    const link = await requestMagicLink("lien-perime@example.fr");
    const verification = await latestVerification();
    await createDatabase(platform.env.DB)
      .update(verifications)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(verifications.id, verification?.id ?? ""));
    const response = await platform.request(`${link.pathname}${link.search}`);
    expect(platform.sessionCookieOf(response)).toBe("");
  });

  it("works only once", async () => {
    await platform.signIn("lien-unique@example.fr");
    const link = await requestMagicLink("lien-unique@example.fr");
    const first = await platform.request(`${link.pathname}${link.search}`);
    expect(platform.sessionCookieOf(first)).not.toBe("");
    const second = await platform.request(`${link.pathname}${link.search}`);
    expect(platform.sessionCookieOf(second)).toBe("");
  });
});
