import { TERMS_VERSION } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestPlatform, APP_URL, type TestPlatform } from "./test-platform";

let platform: TestPlatform;

const PASSWORD = "cheminee-propre-2026";
const RESET_REDIRECT = `${APP_URL}/mot-de-passe/nouveau`;

const post = (path: string, body: unknown, headers: HeadersInit = {}, cookie?: string) =>
  platform.request(path, { method: "POST", body: JSON.stringify(body), headers }, cookie);

const signUp = (email: string, password = PASSWORD, termsVersion: number | null = TERMS_VERSION) =>
  post("/api/auth/sign-up/email", { name: "Jean Dupont", email, password, termsVersion });

const signInWithPassword = (email: string, password: string, headers: HeadersInit = {}) =>
  post("/api/auth/sign-in/email", { email, password }, headers);

const sessionCookieOf = (response: Response) => platform.sessionCookieOf(response);

const requestReset = (email: string) =>
  post("/api/auth/request-password-reset", { email, redirectTo: RESET_REDIRECT });

const resetTokenFromLastEmail = () =>
  new URL(platform.lastLoggedUrl()).pathname.split("/").at(-1) ?? "";

beforeAll(async () => {
  platform = await startTestPlatform();
});

afterAll(async () => {
  await platform.dispose();
});

describe("password sign-up and sign-in", () => {
  it("creates an account with a name and opens a session", async () => {
    const response = await signUp("nouveau@example.fr");
    expect(response.status).toBe(200);
    expect(sessionCookieOf(response)).not.toBe("");
  });

  it("records the accepted terms version and date", async () => {
    const response = await signUp("conditions@example.fr");
    const body: unknown = await response.json();
    expect(body).toMatchObject({
      user: { termsVersion: TERMS_VERSION, termsAcceptedAt: expect.any(String) },
    });
  });

  it("refuses a sign-up without the current terms", async () => {
    const withoutTerms = await signUp("sans-conditions@example.fr", PASSWORD, null);
    const oldTerms = await signUp("anciennes-conditions@example.fr", PASSWORD, TERMS_VERSION - 1);
    expect(withoutTerms.status).toBe(400);
    expect(oldTerms.status).toBe(400);
  });

  it("refuses a password shorter than 12 characters", async () => {
    const response = await signUp("court@example.fr", "trop-court");
    expect(response.status).toBe(400);
  });

  it("refuses a second account with the same email", async () => {
    await signUp("double@example.fr");
    const response = await signUp("double@example.fr");
    expect(response.status).toBe(422);
  });

  it("signs in with the right password and refuses a wrong one", async () => {
    await signUp("connexion@example.fr");
    const signedIn = await signInWithPassword("connexion@example.fr", PASSWORD);
    expect(signedIn.status).toBe(200);
    expect(sessionCookieOf(signedIn)).not.toBe("");

    const refused = await signInWithPassword("connexion@example.fr", "mauvais-mot-de-passe");
    expect(refused.status).toBe(401);
    expect(refused.headers.get("x-trace-id")).toMatch(/^[0-9a-f]{32}$/);
  });

  it("limits repeated sign-in attempts from the same address", async () => {
    await signUp("insistant@example.fr");
    const headers = { "cf-connecting-ip": "203.0.113.7" };
    const attempts = Array.from({ length: 11 }, () =>
      signInWithPassword("insistant@example.fr", "mauvais-mot-de-passe", headers),
    );
    const statuses = (await Promise.all(attempts)).map((response) => response.status);
    expect(statuses.filter((status) => status === 401)).toHaveLength(10);
    expect(statuses.filter((status) => status === 429)).toHaveLength(1);
  });
});

describe("password reset", () => {
  it("answers the same way for a known and an unknown email", async () => {
    await signUp("connu@example.fr");
    const known = await requestReset("connu@example.fr");
    const unknown = await requestReset("inconnu@example.fr");
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(await unknown.json()).toEqual(await known.json());
  });

  it("changes the password with the emailed link, once, and revokes sessions", async () => {
    const signedUp = await signUp("oubli@example.fr");
    const oldSession = sessionCookieOf(signedUp);
    await requestReset("oubli@example.fr");
    const token = resetTokenFromLastEmail();
    const newPassword = "nouveau-ramonage-2027";

    const reset = await post("/api/auth/reset-password", { token, newPassword });
    expect(reset.status).toBe(200);

    const reused = await post("/api/auth/reset-password", {
      token,
      newPassword: "encore-un-autre-2028",
    });
    expect(reused.status).toBe(400);

    const session = await platform.request("/api/auth/get-session", {}, oldSession);
    expect(await session.json()).toBeNull();

    expect((await signInWithPassword("oubli@example.fr", PASSWORD)).status).toBe(401);
    expect((await signInWithPassword("oubli@example.fr", newPassword)).status).toBe(200);
  });

  it("redirects the emailed link to the app with the token", async () => {
    await signUp("lien@example.fr");
    await requestReset("lien@example.fr");
    const link = new URL(platform.lastLoggedUrl());
    const response = await platform.request(`${link.pathname}${link.search}`);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain(`${RESET_REDIRECT}?token=`);
  });
});

describe("magic link", () => {
  it("signs in an existing account", async () => {
    await signUp("lien-magique@example.fr");
    const cookie = await platform.signInWithMagicLink("lien-magique@example.fr");
    expect(cookie).not.toBe("");
  });

  it("does not create an account for an unknown email", async () => {
    const cookie = await platform.signInWithMagicLink("sans-compte@example.fr");
    expect(cookie).toBe("");
  });
});
