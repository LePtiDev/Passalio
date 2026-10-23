import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { seedCompanyData, type CompanyData } from "./company-data-fixture";
import { impersonateSession, openSecondSession } from "./matrix-sessions";
import {
  isWriteRoute,
  MEMBER_ROUTES,
  PLATFORM_ROUTES,
  SESSION_ROUTES,
  type SessionRoute,
} from "./route-declarations";
import { sendSample } from "./route-samples";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const meResponse = z.object({ actor: z.object({ isImpersonating: z.boolean() }).loose() });
const fileResponse = z.object({
  customer: z.object({ lastName: z.string().nullable() }).loose(),
  sites: z.array(z.object({ city: z.string() }).loose()),
});

const SUPPORT_EMAIL = "support-impersonation@passalio.com";

const WRITE_ROUTES = SESSION_ROUTES.filter(
  (route) => isWriteRoute(route) && route.access !== "platform",
);
const MEMBER_READ_ROUTES = MEMBER_ROUTES.filter((route) => !isWriteRoute(route));
const PLATFORM_READ_ROUTES = PLATFORM_ROUTES.filter((route) => !isWriteRoute(route));

let platform: TestPlatform;
let companyA: CompanyData;
let impersonatedOwner: string;
let impersonatedAdmin: string;

const impersonatedCookieFor = (route: SessionRoute) =>
  route.access === "platform" ? impersonatedAdmin : impersonatedOwner;

beforeAll(async () => {
  platform = await startTestPlatform();
  companyA = await seedCompanyData(platform, "impersonation");
  await signInAsAdmin(platform, SUPPORT_EMAIL, "admin");
  impersonatedOwner = await openSecondSession(
    platform,
    "patron-impersonation@example.fr",
    companyA.ids.organizationId,
  );
  await impersonateSession(platform, impersonatedOwner, SUPPORT_EMAIL);
  impersonatedAdmin = await signInAsAdmin(platform, "admin-vu-comme@passalio.com", "superadmin");
  await impersonateSession(platform, impersonatedAdmin, SUPPORT_EMAIL);
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("writes during an impersonation", () => {
  it.each(WRITE_ROUTES)("$method $path is refused as read only", async (route) => {
    const response = await sendSample(platform, route, companyA.ids, impersonatedCookieFor(route));
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("impersonation_read_only");
  });

  it("leaves the company data unchanged after every refused write", async () => {
    const response = await platform.request(
      `/api/customers/${companyA.ids.customerId}`,
      {},
      companyA.ownerCookie,
    );
    expect(response.status).toBe(200);
    const file = fileResponse.parse(await response.json());
    expect(file.customer.lastName).toBe("Client impersonation");
    expect(file.sites.map(({ city }) => city)).toEqual(["Paris"]);
  });
});

describe("reads during an impersonation", () => {
  it("tells the app that the session is an impersonation", async () => {
    const response = await platform.request("/api/me", {}, impersonatedOwner);
    expect(meResponse.parse(await response.json()).actor.isImpersonating).toBe(true);
  });

  it.each(MEMBER_READ_ROUTES)("$method $path still answers 200", async (route) => {
    const response = await sendSample(platform, route, companyA.ids, impersonatedOwner);
    expect(response.status).toBe(200);
  });

  it.each(PLATFORM_READ_ROUTES)(
    "$method $path hides the admin space with 404 even for a platform admin",
    async (route) => {
      const response = await sendSample(platform, route, companyA.ids, impersonatedAdmin);
      expect(response.status).toBe(404);
      expect(errorResponse.parse(await response.json()).error).toBe("not_found");
    },
  );
});
