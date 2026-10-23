import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signInAsAdmin } from "../admin-session";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { seedCompanyData, type CompanyData } from "./company-data-fixture";
import { impersonateSession, openSecondSession } from "./matrix-sessions";
import { isWriteRoute, MEMBER_ROUTES, PLATFORM_ROUTES, USER_ROUTES } from "./route-declarations";
import { sendSample } from "./route-samples";

const SUPPORT_EMAIL = "support-effets@passalio.com";

const COMPANY_WRITE_ROUTES = [...USER_ROUTES, ...MEMBER_ROUTES].filter(isWriteRoute);
const PLATFORM_WRITE_ROUTES = PLATFORM_ROUTES.filter(isWriteRoute);

let platform: TestPlatform;
let companyA: CompanyData;
let impersonatedOwner: string;
let impersonatedTechnician: string;
let impersonatedAdmin: string;
let witnessAdmin: string;

const textOf = async (path: string, cookie: string) => {
  const response = await platform.request(path, {}, cookie);
  return `${response.status} ${await response.text()}`;
};

const companySnapshot = async () => {
  const cookie = companyA.ownerCookie;
  return Promise.all([
    textOf(`/api/customers/${companyA.ids.customerId}`, cookie),
    textOf("/api/customers", cookie),
    textOf("/api/members", cookie),
    textOf("/api/invitations", cookie),
    textOf("/api/organization", cookie),
    textOf("/api/organization/logo", cookie),
    textOf(`/api/photos/${companyA.ids.photoId}`, cookie),
  ]);
};

const platformSnapshot = async () =>
  Promise.all([
    textOf("/api/admin/team", witnessAdmin),
    textOf("/api/admin/prospects/companies", witnessAdmin),
    textOf("/api/admin/prospects/contacts", witnessAdmin),
  ]);

beforeAll(async () => {
  platform = await startTestPlatform();
  companyA = await seedCompanyData(platform, "impersonation-effets");
  await signInAsAdmin(platform, SUPPORT_EMAIL, "admin");
  witnessAdmin = await signInAsAdmin(platform, "temoin-effets@passalio.com", "superadmin");
  impersonatedOwner = await openSecondSession(
    platform,
    "patron-impersonation-effets@example.fr",
    companyA.ids.organizationId,
  );
  await impersonateSession(platform, impersonatedOwner, SUPPORT_EMAIL);
  impersonatedTechnician = await openSecondSession(
    platform,
    companyA.technicianEmail,
    companyA.ids.organizationId,
  );
  await impersonateSession(platform, impersonatedTechnician, SUPPORT_EMAIL);
  impersonatedAdmin = await signInAsAdmin(platform, "admin-vu-effets@passalio.com", "superadmin");
  await impersonateSession(platform, impersonatedAdmin, SUPPORT_EMAIL);
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("refused writes during an impersonation change nothing", () => {
  it("leaves every company read exactly as it was after all company writes", async () => {
    const before = await companySnapshot();
    const statuses = await COMPANY_WRITE_ROUTES.reduce<Promise<number[]>>(
      async (previous, route) => [
        ...(await previous),
        (await sendSample(platform, route, companyA.ids, impersonatedOwner)).status,
      ],
      Promise.resolve([]),
    );
    expect(statuses).toEqual(COMPANY_WRITE_ROUTES.map(() => 403));
    expect(await companySnapshot()).toEqual(before);
  });

  it("refuses every company write of an impersonated technician too", async () => {
    const before = await companySnapshot();
    const statuses = await COMPANY_WRITE_ROUTES.reduce<Promise<number[]>>(
      async (previous, route) => [
        ...(await previous),
        (await sendSample(platform, route, companyA.ids, impersonatedTechnician)).status,
      ],
      Promise.resolve([]),
    );
    expect(statuses).toEqual(COMPANY_WRITE_ROUTES.map(() => 403));
    expect(await companySnapshot()).toEqual(before);
  });

  it("leaves the Passalio team and prospects as they were after all admin writes", async () => {
    const before = await platformSnapshot();
    const statuses = await PLATFORM_WRITE_ROUTES.reduce<Promise<number[]>>(
      async (previous, route) => [
        ...(await previous),
        (await sendSample(platform, route, companyA.ids, impersonatedAdmin)).status,
      ],
      Promise.resolve([]),
    );
    expect(statuses.every((status) => status >= 400)).toBe(true);
    expect(await platformSnapshot()).toEqual(before);
  });
});
