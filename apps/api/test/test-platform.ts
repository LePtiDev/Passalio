import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { vi } from "vitest";
import { getPlatformProxy } from "wrangler";
import { app } from "../src/app";
import type { Bindings } from "../src/env";

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "../../../packages/db/migrations");
const STATEMENT_BREAKPOINT = "--> statement-breakpoint";

export const APP_URL = "http://localhost:5173";
export const TEST_PASSWORD = "mot-de-passe-de-test";

const applyMigrations = async (database: D1Database) => {
  const files = (await readdir(MIGRATIONS_DIRECTORY))
    .filter((file) => file.endsWith(".sql"))
    .toSorted((left, right) => left.localeCompare(right));
  const contents = await Promise.all(
    files.map((file) => readFile(join(MIGRATIONS_DIRECTORY, file), "utf8")),
  );
  const statements = contents
    .flatMap((sql) => sql.split(STATEMENT_BREAKPOINT))
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
  await database.batch(statements.map((statement) => database.prepare(statement)));
};

const loggedUrls = (calls: readonly (readonly unknown[])[]): string[] =>
  calls.flatMap(([line]) => {
    const parsed: unknown = JSON.parse(String(line));
    return typeof parsed === "object" &&
      parsed !== null &&
      "event" in parsed &&
      parsed.event === "email_logged" &&
      "url" in parsed &&
      typeof parsed.url === "string"
      ? [parsed.url]
      : [];
  });

const randomByte = () => Math.floor(Math.random() * 256);

const randomIpAddress = () => `10.${randomByte()}.${randomByte()}.${randomByte()}`;

const sessionCookieOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("better-auth.session_token="))
    ?.split(";")[0] ?? "";

export type TestPlatform = Awaited<ReturnType<typeof startTestPlatform>>;

export const startTestPlatform = async () => {
  const proxy = await getPlatformProxy<Bindings>({ persist: false });
  await applyMigrations(proxy.env.DB);
  const env: Bindings = {
    ...proxy.env,
    BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-better-auth",
    BETTER_AUTH_URL: "http://localhost:8787",
    APP_URL,
    EMAIL_DELIVERY: "log",
  };
  const logs = vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);

  const request = async (path: string, init: RequestInit = {}, cookie?: string) => {
    const headers = new Headers(init.headers);
    headers.set("origin", APP_URL);
    if (!headers.has("cf-connecting-ip")) {
      headers.set("cf-connecting-ip", randomIpAddress());
    }
    if (cookie !== undefined) {
      headers.set("cookie", cookie);
    }
    if (init.body !== undefined) {
      headers.set("content-type", "application/json");
    }
    return app.request(path, { ...init, headers }, env);
  };

  const lastLoggedUrl = () => loggedUrls(logs.mock.calls).at(-1) ?? "";

  const signIn = async (email: string): Promise<string> => {
    const credentials = { email, password: TEST_PASSWORD };
    const signedUp = await request("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({ ...credentials, name: email.split("@")[0] }),
    });
    if (signedUp.ok) {
      return sessionCookieOf(signedUp);
    }
    const signedIn = await request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return sessionCookieOf(signedIn);
  };

  const signInWithMagicLink = async (email: string): Promise<string> => {
    await request("/api/auth/sign-in/magic-link", {
      method: "POST",
      body: JSON.stringify({ email, callbackURL: APP_URL }),
    });
    const verifyUrl = new URL(lastLoggedUrl());
    return sessionCookieOf(await request(`${verifyUrl.pathname}${verifyUrl.search}`));
  };

  const setActiveOrganization = (cookie: string, organizationId: string) =>
    request(
      "/api/auth/organization/set-active",
      { method: "POST", body: JSON.stringify({ organizationId }) },
      cookie,
    );

  return {
    env,
    request,
    signIn,
    signInWithMagicLink,
    sessionCookieOf,
    setActiveOrganization,
    lastLoggedUrl,
    dispose: () => proxy.dispose(),
  };
};
