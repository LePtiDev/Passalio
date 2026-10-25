import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TERMS_VERSION } from "@passalio/shared";
import { vi } from "vitest";
import { getPlatformProxy } from "wrangler";
import { app } from "../src/app";
import { handleRequest } from "../src/index";
import { TestExecutionContext } from "./test-execution-context";
import type { Bindings } from "../src/env";

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "../../../packages/db/migrations");
const STATEMENT_BREAKPOINT = "--> statement-breakpoint";

export const APP_URL = "http://localhost:5173";
export const SITE_URL = "http://localhost:4321";
export const TEST_PASSWORD = "mot-de-passe-de-test";
export const VALID_CAPTCHA_TOKEN = "jeton-turnstile-valide";

const TURNSTILE_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const captchaTokenOf = (init: RequestInit | undefined): unknown => {
  const body: unknown = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
  return typeof body === "object" && body !== null && "response" in body ? body.response : null;
};

export type ExternalService = (
  url: string,
  init: RequestInit | undefined,
) => Promise<Response> | undefined;

const stubExternalServices = (externalService: ExternalService | undefined) => {
  const realFetch = globalThis.fetch;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const external = externalService?.(url, init);
    if (external !== undefined) {
      return external;
    }
    if (!url.startsWith(TURNSTILE_SITEVERIFY_URL)) {
      return realFetch(input, init);
    }
    const isValid = captchaTokenOf(init) === VALID_CAPTCHA_TOKEN;
    return Response.json(
      isValid ? { success: true } : { success: false, "error-codes": ["invalid-input-response"] },
    );
  });
};

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

export type TestPlatformOptions = {
  readonly bindings?: Partial<Bindings>;
  readonly externalService?: ExternalService;
};

export const startTestPlatform = async ({
  bindings = {},
  externalService,
}: TestPlatformOptions = {}) => {
  const proxy = await getPlatformProxy<Bindings>({ persist: false });
  await applyMigrations(proxy.env.DB);
  const env: Bindings = {
    ...proxy.env,
    BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-better-auth",
    BETTER_AUTH_URL: "http://localhost:8787",
    APP_URL,
    SITE_URL,
    EMAIL_DELIVERY: "log",
    EMAIL_FROM: "Passalio <ne-pas-repondre@passalio.com>",
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    ...bindings,
  };
  stubExternalServices(externalService);
  const logs = vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);

  const request = async (path: string, init: RequestInit = {}, cookie?: string) => {
    const headers = new Headers(init.headers);
    headers.set("origin", APP_URL);
    if (!headers.has("cf-connecting-ip")) {
      headers.set("cf-connecting-ip", randomIpAddress());
    }
    if (!headers.has("x-captcha-response")) {
      headers.set("x-captcha-response", VALID_CAPTCHA_TOKEN);
    }
    if (cookie !== undefined) {
      headers.set("cookie", cookie);
    }
    if (init.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return app.request(path, { ...init, headers }, env);
  };

  const workerRequest = async (path: string, init: RequestInit = {}) =>
    handleRequest(new Request(`${APP_URL}${path}`, init), env, new TestExecutionContext());

  const loggedLines = () => logs.mock.calls.map(([line]) => String(line));

  const lastLoggedUrl = () => loggedUrls(logs.mock.calls).at(-1) ?? "";

  const signIn = async (email: string): Promise<string> => {
    const credentials = { email, password: TEST_PASSWORD };
    const signedUp = await request("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({
        ...credentials,
        name: email.split("@")[0],
        termsVersion: TERMS_VERSION,
      }),
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
    workerRequest,
    loggedLines,
    signIn,
    signInWithMagicLink,
    sessionCookieOf,
    setActiveOrganization,
    lastLoggedUrl,
    dispose: () => proxy.dispose(),
  };
};
