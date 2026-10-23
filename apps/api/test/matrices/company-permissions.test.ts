import { ORGANIZATION_ROLES, type OrganizationRole, type Permission } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { isCompanyPermissionGranted } from "../../../../packages/shared/test/permission-requirements";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createOrganization, joinOrganization } from "./matrix-sessions";
import { MEMBER_ROUTES, type MemberRoute } from "./route-declarations";
import { sendSample } from "./route-samples";
import { randomSampleIds } from "./sample-request";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const meResponse = z.object({
  actor: z.object({ role: z.string(), isImpersonating: z.boolean() }),
});
const pushResponse = z.object({
  results: z.array(z.object({ status: z.string(), error: z.string().optional() })),
});

type GuardedRoute = MemberRoute & { readonly permission: Permission };

const isGuarded = (route: MemberRoute): route is GuardedRoute => route.permission !== null;

const roleCases = ORGANIZATION_ROLES.flatMap((role) =>
  MEMBER_ROUTES.filter(isGuarded).map((route) => ({
    role,
    route,
    isGranted: isCompanyPermissionGranted(role, route.permission),
  })),
);

let platform: TestPlatform;
const cookies = new Map<OrganizationRole, string>();

const cookieOf = (role: OrganizationRole) => cookies.get(role) ?? "";

beforeAll(async () => {
  platform = await startTestPlatform();
  const owner = await platform.signIn("patron-permissions@example.fr");
  const organizationId = await createOrganization(platform, owner, "Ramonage Permissions");
  cookies.set("owner", owner);
  cookies.set(
    "admin",
    await joinOrganization(
      platform,
      owner,
      organizationId,
      "admin-permissions@example.fr",
      "admin",
    ),
  );
  cookies.set(
    "secretary",
    await joinOrganization(
      platform,
      owner,
      organizationId,
      "secretariat-permissions@example.fr",
      "secretary",
    ),
  );
  cookies.set(
    "technician",
    await joinOrganization(
      platform,
      owner,
      organizationId,
      "technicien-permissions@example.fr",
      "technician",
    ),
  );
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("company roles on every guarded route", () => {
  it.each(ORGANIZATION_ROLES)("the %s is recognized with its role", async (role) => {
    const response = await platform.request("/api/me", {}, cookieOf(role));
    expect(meResponse.parse(await response.json()).actor).toEqual({
      role,
      isImpersonating: false,
    });
  });

  it.each(roleCases.filter(({ isGranted }) => !isGranted))(
    "the $role is refused $route.method $route.path with 403 (no $route.permission)",
    async ({ role, route }) => {
      const response = await sendSample(platform, route, randomSampleIds(), cookieOf(role));
      expect(response.status).toBe(403);
      expect(errorResponse.parse(await response.json()).error).toBe("forbidden");
    },
  );

  it.each(roleCases.filter(({ isGranted }) => isGranted))(
    "the $role passes the permission check of $route.method $route.path ($route.permission)",
    async ({ role, route }) => {
      const response = await sendSample(platform, route, randomSampleIds(), cookieOf(role));
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    },
  );
});

describe("company roles on synchronized changes", () => {
  it.each(
    ORGANIZATION_ROLES.map((role) => ({
      role,
      expectedForbidden: !isCompanyPermissionGranted(role, "customers:archive"),
    })),
  )(
    "the $role archiving a customer offline is refused as forbidden: $expectedForbidden",
    async ({ role, expectedForbidden }) => {
      const response = await platform.request(
        "/api/sync/push",
        {
          method: "POST",
          body: JSON.stringify({
            mutations: [
              {
                id: crypto.randomUUID(),
                mutation: { type: "archive_customer", customerId: crypto.randomUUID() },
              },
            ],
          }),
        },
        cookieOf(role),
      );
      expect(response.status).toBe(200);
      const [result] = pushResponse.parse(await response.json()).results;
      expect(result?.status).toBe("rejected");
      expect(result?.error === "forbidden").toBe(expectedForbidden);
    },
  );
});
