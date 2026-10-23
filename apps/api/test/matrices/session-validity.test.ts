import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createOrganization, sessionTokenOf } from "./matrix-sessions";
import { SESSION_ROUTES, type SessionRoute } from "./route-declarations";
import { sendSample } from "./route-samples";
import { randomSampleIds } from "./sample-request";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

const INVALID_SESSION_KINDS = ["tampered", "expired", "signed out"] as const;

type InvalidSessionKind = (typeof INVALID_SESSION_KINDS)[number];

const ONE_HOUR_MS = 60 * 60 * 1000;

let platform: TestPlatform;
const memberSessions = new Map<InvalidSessionKind, string>();
const adminSessions = new Map<InvalidSessionKind, string>();

const expireSession = async (cookie: string) => {
  await platform.env.DB.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?")
    .bind(Date.now() - ONE_HOUR_MS, sessionTokenOf(cookie))
    .run();
};

const signOut = async (cookie: string) => {
  const response = await platform.request("/api/auth/sign-out", { method: "POST" }, cookie);
  expect(response.status).toBe(200);
};

const tampered = (cookie: string) => {
  const [name, value] = cookie.split("=");
  const [token] = decodeURIComponent(value ?? "").split(".");
  return `${name}=${encodeURIComponent(`${token}.c2lnbmF0dXJlLWZhbHNpZmllZQ==`)}`;
};

const ownerSession = async (email: string) => {
  const cookie = await platform.signIn(email);
  await createOrganization(platform, cookie, `Ramonage ${email.split("@")[0]}`);
  return cookie;
};

const invalidSessionCases = INVALID_SESSION_KINDS.flatMap((kind) =>
  SESSION_ROUTES.map((route) => ({ kind, route })),
);

const cookieFor = (kind: InvalidSessionKind, route: SessionRoute) =>
  (route.access === "platform" ? adminSessions : memberSessions).get(kind) ?? "";

beforeAll(async () => {
  platform = await startTestPlatform();
  const tamperedOwner = await ownerSession("patron-signature-falsifiee@example.fr");
  memberSessions.set("tampered", tampered(tamperedOwner));
  const expiredOwner = await ownerSession("patron-session-expiree@example.fr");
  await expireSession(expiredOwner);
  memberSessions.set("expired", expiredOwner);
  const signedOutOwner = await ownerSession("patron-deconnecte@example.fr");
  await signOut(signedOutOwner);
  memberSessions.set("signed out", signedOutOwner);

  adminSessions.set(
    "tampered",
    tampered(await signInAsAdmin(platform, "admin-signature-falsifiee@passalio.com")),
  );
  const expiredAdmin = await signInAsAdmin(platform, "admin-session-expiree@passalio.com");
  await expireSession(expiredAdmin);
  adminSessions.set("expired", expiredAdmin);
  const signedOutAdmin = await signInAsAdmin(platform, "admin-deconnecte@passalio.com");
  await signOut(signedOutAdmin);
  adminSessions.set("signed out", signedOutAdmin);
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("sessions that are no longer valid", () => {
  it.each(invalidSessionCases.filter(({ route }) => route.access !== "platform"))(
    "$route.method $route.path asks to sign in again with a $kind session",
    async ({ kind, route }) => {
      const response = await sendSample(platform, route, randomSampleIds(), cookieFor(kind, route));
      expect(response.status).toBe(401);
      expect(errorResponse.parse(await response.json()).error).toBe("unauthenticated");
    },
  );

  it.each(invalidSessionCases.filter(({ route }) => route.access === "platform"))(
    "$route.method $route.path hides the admin space with 404 for a $kind admin session",
    async ({ kind, route }) => {
      const response = await sendSample(platform, route, randomSampleIds(), cookieFor(kind, route));
      expect(response.status).toBe(404);
      expect(errorResponse.parse(await response.json()).error).toBe("not_found");
    },
  );

  it("still recognizes the valid sessions the invalid ones were made from", async () => {
    const owner = await ownerSession("patron-session-valide@example.fr");
    expect((await platform.request("/api/me", {}, owner)).status).toBe(200);
    const admin = await signInAsAdmin(platform, "admin-session-valide@passalio.com");
    expect((await platform.request("/api/admin/me", {}, admin)).status).toBe(200);
  });

  it("does not open a session from a cookie that names an unknown token", async () => {
    const cookie = "better-auth.session_token=jeton-invente";
    expect((await platform.request("/api/me", {}, cookie)).status).toBe(401);
    expect((await platform.request("/api/admin/me", {}, cookie)).status).toBe(404);
  });
});

describe("the MCP endpoint with a bearer token it did not issue", () => {
  it.each(["GET", "POST"])("%s /mcp answers 401 with a Bearer challenge", async (method) => {
    const response = await platform.request("/mcp", {
      method,
      headers: { authorization: "Bearer jeton-mcp-invente" },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toMatch(/^Bearer /);
  });
});
