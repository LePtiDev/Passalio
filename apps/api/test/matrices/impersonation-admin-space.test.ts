import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createOrganization, impersonateSession } from "./matrix-sessions";
import { isWriteRoute, PLATFORM_ROUTES } from "./route-declarations";
import { sendSample } from "./route-samples";
import { randomSampleIds } from "./sample-request";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

const SUPPORT_EMAIL = "support-espace-admin@passalio.com";

const IMPERSONATED_SESSIONS = ["a company owner", "a platform superadmin"] as const;

type ImpersonatedSession = (typeof IMPERSONATED_SESSIONS)[number];

let platform: TestPlatform;
const sessions = new Map<ImpersonatedSession, string>();

const cases = IMPERSONATED_SESSIONS.flatMap((impersonated) =>
  PLATFORM_ROUTES.filter(isWriteRoute).map((route) => ({ impersonated, route })),
);

beforeAll(async () => {
  platform = await startTestPlatform();
  await signInAsAdmin(platform, SUPPORT_EMAIL, "admin");
  const owner = await platform.signIn("patron-espace-admin@example.fr");
  await createOrganization(platform, owner, "Ramonage Espace Admin");
  await impersonateSession(platform, owner, SUPPORT_EMAIL);
  sessions.set("a company owner", owner);
  const superadmin = await signInAsAdmin(platform, "superadmin-vu-comme@passalio.com");
  await impersonateSession(platform, superadmin, SUPPORT_EMAIL);
  sessions.set("a platform superadmin", superadmin);
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("admin space writes during an impersonation", () => {
  it.each(cases)(
    "$route.method $route.path hides the admin space with 404 while impersonating $impersonated",
    async ({ impersonated, route }) => {
      const response = await sendSample(
        platform,
        route,
        randomSampleIds(),
        sessions.get(impersonated),
      );
      expect(response.status).toBe(404);
      expect(errorResponse.parse(await response.json()).error).toBe("not_found");
    },
  );
});
