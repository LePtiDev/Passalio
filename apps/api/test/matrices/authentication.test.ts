import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { DECLARED_ROUTES, MEMBER_ROUTES, PLATFORM_ROUTES, USER_ROUTES } from "./route-declarations";
import { sendSample } from "./route-samples";
import { randomSampleIds } from "./sample-request";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

const PUBLIC_ROUTES = DECLARED_ROUTES.filter(({ access }) => access === "public");

let platform: TestPlatform;
let withoutOrganization: string;

beforeAll(async () => {
  platform = await startTestPlatform();
  withoutOrganization = await platform.signIn("sans-entreprise-matrice@example.fr");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("routes without a session", () => {
  it.each([...USER_ROUTES, ...MEMBER_ROUTES])(
    "$method $path asks to sign in with 401 and a trace id",
    async (route) => {
      const response = await sendSample(platform, route, randomSampleIds());
      expect(response.status).toBe(401);
      expect(errorResponse.parse(await response.json()).error).toBe("unauthenticated");
    },
  );

  it.each(PLATFORM_ROUTES)("$method $path hides the admin space with 404", async (route) => {
    const response = await sendSample(platform, route, randomSampleIds());
    expect(response.status).toBe(404);
    expect(errorResponse.parse(await response.json()).error).toBe("not_found");
  });

  it.each(["GET", "POST"])("%s /mcp asks for a bearer token with 401", async (method) => {
    const response = await platform.request("/mcp", { method });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toMatch(/^Bearer /);
  });

  it.each(PUBLIC_ROUTES)("$method $path stays public", async ({ path }) => {
    const response = await platform.request(path);
    expect(response.status).toBe(200);
  });
});

describe("company routes without an active organization", () => {
  it.each(MEMBER_ROUTES)("$method $path asks for an organization with 403", async (route) => {
    const response = await sendSample(platform, route, randomSampleIds(), withoutOrganization);
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("no_active_organization");
  });
});
