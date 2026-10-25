import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { app } from "../../src/app";
import { APP_URL, SITE_URL, startTestPlatform, type TestPlatform } from "../test-platform";
import { DECLARED_ROUTES } from "./route-declarations";

const errorResponse = z.object({ error: z.string() });

const WEBSITE_ROUTES = DECLARED_ROUTES.filter(({ access }) => access === "website");

let platform: TestPlatform;

beforeAll(async () => {
  platform = await startTestPlatform();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("routes open to the website", () => {
  it("declares at least one website route", () => {
    expect(WEBSITE_ROUTES.length).toBeGreaterThan(0);
  });

  it.each(WEBSITE_ROUTES)(
    "$method $path checks the request without asking for a session",
    async ({ method, path }) => {
      const response = await platform.request(path, { method, body: "{}" });
      expect(response.status).toBe(400);
      expect(errorResponse.parse(await response.json()).error).toBe("invalid_request");
    },
  );

  it.each(WEBSITE_ROUTES)("$method $path lets only the website read the answer", async (route) => {
    const preflightFrom = (origin: string) =>
      app.request(
        route.path,
        {
          method: "OPTIONS",
          headers: { origin, "access-control-request-method": route.method },
        },
        platform.env,
      );
    const [fromSite, fromApp] = await Promise.all([
      preflightFrom(SITE_URL),
      preflightFrom(APP_URL),
    ]);
    expect([
      fromSite.headers.get("access-control-allow-origin"),
      fromApp.headers.get("access-control-allow-origin"),
    ]).toEqual([SITE_URL, null]);
  });
});
