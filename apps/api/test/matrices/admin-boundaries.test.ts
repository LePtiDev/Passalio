import { PLATFORM_ROLES, type PlatformRole } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { isPlatformPermissionGranted } from "../../../../packages/shared/test/permission-requirements";
import { enableTwoFactor, signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createOrganization, setTwoFactorProofAge } from "./matrix-sessions";
import { PLATFORM_ROUTES } from "./route-declarations";
import { sendSample } from "./route-samples";
import { randomSampleIds } from "./sample-request";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const createdCompany = z.object({ id: z.string() }).loose();

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

const OUTSIDERS = [
  "a company owner with an active organization",
  "a regular user with two-factor enabled",
  "a user whose role is the default user role",
] as const;

type Outsider = (typeof OUTSIDERS)[number];

let platform: TestPlatform;
const outsiders = new Map<Outsider, string>();
const staleProofs = new Map<PlatformRole, string>();
const freshAdmins = new Map<PlatformRole, string>();

const outsiderCases = OUTSIDERS.flatMap((outsider) =>
  PLATFORM_ROUTES.map((route) => ({ outsider, route })),
);

beforeAll(async () => {
  platform = await startTestPlatform();
  const owner = await platform.signIn("patron-hors-equipe@example.fr");
  await createOrganization(platform, owner, "Ramonage Hors Equipe");
  outsiders.set("a company owner with an active organization", owner);
  const { cookie } = await enableTwoFactor(
    platform,
    await platform.signIn("artisan-double-facteur@example.fr"),
  );
  outsiders.set("a regular user with two-factor enabled", cookie);
  const defaultRole = await platform.signIn("role-par-defaut@example.fr");
  await platform.env.DB.prepare("UPDATE users SET role = 'user' WHERE email = ?")
    .bind("role-par-defaut@example.fr")
    .run();
  outsiders.set("a user whose role is the default user role", defaultRole);
  await Promise.all(
    PLATFORM_ROLES.map(async (role) => {
      const stale = await signInAsAdmin(platform, `${role}-preuve-perimee@passalio.com`, role);
      await setTwoFactorProofAge(platform, stale, TWELVE_HOURS_MS + ONE_MINUTE_MS);
      staleProofs.set(role, stale);
      freshAdmins.set(role, await signInAsAdmin(platform, `${role}-frais@passalio.com`, role));
    }),
  );
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("admin space for people outside the Passalio team", () => {
  it.each(outsiderCases)(
    "$route.method $route.path answers 404 to $outsider",
    async ({ outsider, route }) => {
      const response = await sendSample(
        platform,
        route,
        randomSampleIds(),
        outsiders.get(outsider),
      );
      expect(response.status).toBe(404);
      expect(errorResponse.parse(await response.json()).error).toBe("not_found");
    },
  );
});

describe("two-factor proof older than 12 hours, for every platform role", () => {
  it.each(PLATFORM_ROLES)("asks the %s for the code again with 401", async (role) => {
    const response = await platform.request("/api/admin/me", {}, staleProofs.get(role));
    expect(response.status).toBe(401);
    expect(errorResponse.parse(await response.json()).error).toBe("two_factor_unverified");
  });

  it.each(PLATFORM_ROLES)("still lets the %s in with a fresh proof", async (role) => {
    const response = await platform.request("/api/admin/me", {}, freshAdmins.get(role));
    expect(response.status).toBe(200);
  });
});

describe("prospects for every platform role", () => {
  it.each(PLATFORM_ROLES.filter((role) => isPlatformPermissionGranted(role, "prospects:write")))(
    "the %s creates a prospect company and reads it back",
    async (role) => {
      const cookie = freshAdmins.get(role);
      const created = await platform.request(
        "/api/admin/prospects/companies",
        {
          method: "POST",
          body: JSON.stringify({ name: `Ramonage prospect de ${role}`, department: "75" }),
        },
        cookie,
      );
      expect(created.status).toBe(201);
      const company = createdCompany.parse(await created.json());
      const read = await platform.request(
        `/api/admin/prospects/companies/${company.id}`,
        {},
        cookie,
      );
      expect(read.status).toBe(200);
    },
  );
});
