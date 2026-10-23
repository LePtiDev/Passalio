import { PLATFORM_ROLES, type PlatformRole } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { isPlatformPermissionGranted } from "../../../../packages/shared/test/permission-requirements";
import { grantPlatformRole, signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { setTwoFactorProofAge } from "./matrix-sessions";
import { PLATFORM_ROUTES } from "./route-declarations";
import { sendSample } from "./route-samples";
import { randomSampleIds } from "./sample-request";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

const roleCases = PLATFORM_ROLES.flatMap((role) =>
  PLATFORM_ROUTES.map((route) => ({
    role,
    route,
    isGranted: route.permission === null || isPlatformPermissionGranted(role, route.permission),
  })),
);

const withoutTwoFactorCases = PLATFORM_ROLES.flatMap((role) =>
  PLATFORM_ROUTES.map((route) => ({ role, route })),
);

let platform: TestPlatform;
let regularUser: string;
let staleProof: string;
let almostStaleProof: string;
let magicLinkSession: string;
const withTwoFactor = new Map<PlatformRole, string>();
const withoutTwoFactor = new Map<PlatformRole, string>();

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

beforeAll(async () => {
  platform = await startTestPlatform();
  regularUser = await platform.signIn("artisan-admin-acces@example.fr");
  await Promise.all(
    PLATFORM_ROLES.map(async (role) => {
      withTwoFactor.set(role, await signInAsAdmin(platform, `${role}-2fa@passalio.com`, role));
      const email = `${role}-sans-2fa@passalio.com`;
      withoutTwoFactor.set(role, await platform.signIn(email));
      await grantPlatformRole(platform, email, role);
    }),
  );
  staleProof = await signInAsAdmin(platform, "preuve-perimee@passalio.com", "superadmin");
  await setTwoFactorProofAge(platform, staleProof, TWELVE_HOURS_MS + ONE_MINUTE_MS);
  almostStaleProof = await signInAsAdmin(platform, "preuve-limite@passalio.com", "superadmin");
  await setTwoFactorProofAge(platform, almostStaleProof, TWELVE_HOURS_MS - 5 * ONE_MINUTE_MS);
  await signInAsAdmin(platform, "lien-magique@passalio.com", "admin");
  magicLinkSession = await platform.signInWithMagicLink("lien-magique@passalio.com");
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("admin space for people outside the Passalio team", () => {
  it.each(PLATFORM_ROUTES)("$method $path answers 404 to a regular user", async (route) => {
    const response = await sendSample(platform, route, randomSampleIds(), regularUser);
    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("not_found");
  });
});

describe("admin space without two-factor authentication", () => {
  it.each(withoutTwoFactorCases)(
    "$route.method $route.path asks the $role to enable two-factor with 403",
    async ({ role, route }) => {
      const response = await sendSample(
        platform,
        route,
        randomSampleIds(),
        withoutTwoFactor.get(role),
      );
      expect(response.status).toBe(403);
      expect(await errorOf(response)).toBe("two_factor_required");
    },
  );
});

describe("admin space with an old or missing two-factor proof", () => {
  it.each(PLATFORM_ROUTES)(
    "$method $path asks for the code again with 401 after 12 hours",
    async (route) => {
      const response = await sendSample(platform, route, randomSampleIds(), staleProof);
      expect(response.status).toBe(401);
      expect(await errorOf(response)).toBe("two_factor_unverified");
    },
  );

  it.each(PLATFORM_ROUTES)(
    "$method $path asks for the code with 401 after an email link sign-in",
    async (route) => {
      const response = await sendSample(platform, route, randomSampleIds(), magicLinkSession);
      expect(response.status).toBe(401);
      expect(await errorOf(response)).toBe("two_factor_unverified");
    },
  );

  it("still accepts a proof a few minutes younger than 12 hours", async () => {
    const response = await platform.request("/api/admin/me", {}, almostStaleProof);
    expect(response.status).toBe(200);
  });
});

describe("platform roles on every admin route", () => {
  it.each(roleCases.filter(({ isGranted }) => !isGranted))(
    "the $role is refused $route.method $route.path with 403 (no $route.permission)",
    async ({ role, route }) => {
      const response = await sendSample(
        platform,
        route,
        randomSampleIds(),
        withTwoFactor.get(role),
      );
      expect(response.status).toBe(403);
      expect(await errorOf(response)).toBe("forbidden");
    },
  );

  it.each(roleCases.filter(({ isGranted }) => isGranted))(
    "the $role passes the access checks of $route.method $route.path",
    async ({ role, route }) => {
      const response = await sendSample(
        platform,
        route,
        randomSampleIds(),
        withTwoFactor.get(role),
      );
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    },
  );
});
