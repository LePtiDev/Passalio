import * as z from "zod";
import { app } from "../../src/app";
import { VALID_CAPTCHA_TOKEN, type TestPlatform } from "../test-platform";

export const PRODUCTION_URL = "https://app.passalio.com";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });

export const jsonRequest = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const fromAddress = (ipAddress: string, headers: Record<string, string> = {}) => ({
  ...headers,
  "cf-connecting-ip": ipAddress,
});

export const createActiveOrganization = async (
  platform: TestPlatform,
  cookie: string,
  name: string,
) => {
  const response = await platform.request("/api/organizations", jsonRequest({ name }), cookie);
  const { organization } = organizationResponse.parse(await response.json());
  await platform.setActiveOrganization(cookie, organization.id);
  return organization.id;
};

export const requestInProduction = (platform: TestPlatform, path: string, init: RequestInit) => {
  const headers = new Headers(init.headers);
  headers.set("origin", PRODUCTION_URL);
  headers.set("cf-connecting-ip", "198.51.100.42");
  headers.set("x-captcha-response", VALID_CAPTCHA_TOKEN);
  headers.set("content-type", "application/json");
  return app.request(
    path,
    { ...init, headers },
    {
      ...platform.env,
      BETTER_AUTH_URL: PRODUCTION_URL,
      APP_URL: PRODUCTION_URL,
    },
  );
};

export const sessionCookieHeader = (response: Response) =>
  response.headers.getSetCookie().find((cookie) => cookie.includes("better-auth.session_token="));

export const isSignedOut = async (platform: TestPlatform, cookie: string) => {
  const response = await platform.request("/api/auth/get-session", {}, cookie);
  return (await response.json()) === null;
};

export const statusesOfSequentialAttempts = (
  count: number,
  attempt: (index: number) => Promise<Response>,
) =>
  Array.from({ length: count }, (_, index) => index).reduce<Promise<number[]>>(
    async (previous, index) => [...(await previous), (await attempt(index)).status],
    Promise.resolve([]),
  );
