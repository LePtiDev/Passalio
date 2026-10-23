import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { impersonateSession, joinOrganization } from "./organization-members";
import { createActiveOrganization, jsonRequest } from "./security-fixtures";

const MEGABYTE = 1024 * 1024;
const LOGO_LIMIT = 2 * MEGABYTE;
const PHOTO_LIMIT = 5 * MEGABYTE;

const idResponse = z.object({ id: z.string() });
const createdCustomerResponse = z.object({ customer: idResponse, site: idResponse });
const equipmentResponse = z.object({ equipment: idResponse });

let platform: TestPlatform;
let owner: string;
let technician: string;
let impersonatedOwner: string;
let otherOwner: string;
let organizationId: string;
let otherOrganizationId: string;
let equipmentId: string;

const bytesOfSize = (size: number, value = 1) => new Uint8Array(size).fill(value);

const uploadLogo = (body: Uint8Array<ArrayBuffer>, contentType: string, cookie: string) =>
  platform.request(
    "/api/organization/logo",
    { method: "PUT", body, headers: { "content-type": contentType } },
    cookie,
  );

const uploadPhoto = (body: Uint8Array<ArrayBuffer>, contentType: string, cookie: string) =>
  platform.request(
    `/api/equipments/${equipmentId}/photos?kind=plate`,
    { method: "POST", body, headers: { "content-type": contentType } },
    cookie,
  );

const storedLogoBytes = async (id: string) => {
  const stored = await platform.env.FILES.get(`organizations/${id}/logo`);
  return stored === null ? null : new Uint8Array(await stored.arrayBuffer());
};

const directivesOf = (response: Response) =>
  (response.headers.get("content-security-policy") ?? "")
    .split(";")
    .map((directive) => directive.trim());

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-limites@example.fr");
  organizationId = await createActiveOrganization(platform, owner, "Ramonage Limites");
  await platform.request(
    "/api/organization",
    jsonRequest({ trades: ["boiler_maintenance"] }, "PATCH"),
    owner,
  );
  technician = await joinOrganization(
    platform,
    owner,
    organizationId,
    "technicien-limites@example.fr",
    "technician",
  );
  impersonatedOwner = await platform.signIn("patron-limites@example.fr");
  await platform.setActiveOrganization(impersonatedOwner, organizationId);
  await impersonateSession(platform, impersonatedOwner, "support-limites@passalio.com");
  otherOwner = await platform.signIn("autre-limites@example.fr");
  otherOrganizationId = await createActiveOrganization(platform, otherOwner, "Autre Limites");
  const created = await platform.request(
    "/api/customers",
    jsonRequest({
      customer: { kind: "individual", lastName: "Limite" },
      site: { address: "2 rue du Four", postalCode: "69003", city: "Lyon", buildingType: "house" },
    }),
    owner,
  );
  const { site } = createdCustomerResponse.parse(await created.json());
  const equipment = await platform.request(
    `/api/sites/${site.id}/equipments`,
    jsonRequest({ kind: "boiler", energy: "gas" }),
    owner,
  );
  equipmentId = equipmentResponse.parse(await equipment.json()).equipment.id;
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("organization logo limits", () => {
  it("accepts a logo of exactly 2 MB", async () => {
    expect((await uploadLogo(bytesOfSize(LOGO_LIMIT), "image/png", owner)).status).toBe(204);
  });

  it("refuses an empty logo", async () => {
    expect((await uploadLogo(new Uint8Array(0), "image/png", owner)).status).toBe(422);
  });

  it("keeps the previous logo when a new one is refused", async () => {
    expect((await uploadLogo(bytesOfSize(16, 7), "image/png", owner)).status).toBe(204);
    expect((await uploadLogo(bytesOfSize(LOGO_LIMIT + 1, 9), "image/png", owner)).status).toBe(422);
    expect((await uploadLogo(bytesOfSize(16, 9), "image/gif", owner)).status).toBe(422);
    expect(await storedLogoBytes(organizationId)).toEqual(bytesOfSize(16, 7));
  });

  it("serves a PNG logo with default-src 'none' and nosniff too", async () => {
    await uploadLogo(bytesOfSize(16), "image/png", owner);
    const logo = await platform.request("/api/organization/logo", {}, technician);
    expect(logo.status).toBe(200);
    expect(directivesOf(logo)).toContain("default-src 'none'");
    expect(logo.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("refuses a logo from a technician and keeps the current one", async () => {
    await uploadLogo(bytesOfSize(16, 3), "image/png", owner);
    expect((await uploadLogo(bytesOfSize(16, 4), "image/png", technician)).status).toBe(403);
    expect(await storedLogoBytes(organizationId)).toEqual(bytesOfSize(16, 3));
  });

  it("refuses a logo during an impersonation and keeps the current one", async () => {
    await uploadLogo(bytesOfSize(16, 5), "image/png", owner);
    expect((await uploadLogo(bytesOfSize(16, 6), "image/png", impersonatedOwner)).status).toBe(403);
    expect(await storedLogoBytes(organizationId)).toEqual(bytesOfSize(16, 5));
  });

  it("stores the logo of another organization under its own key only", async () => {
    await uploadLogo(bytesOfSize(16, 8), "image/png", owner);
    expect((await uploadLogo(bytesOfSize(24, 2), "image/png", otherOwner)).status).toBe(204);
    expect(await storedLogoBytes(organizationId)).toEqual(bytesOfSize(16, 8));
    expect(await storedLogoBytes(otherOrganizationId)).toEqual(bytesOfSize(24, 2));
    const served = await platform.request("/api/organization/logo", {}, owner);
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(bytesOfSize(16, 8));
  });
});

describe("equipment photo limits", () => {
  it("accepts a photo of exactly 5 MB", async () => {
    expect((await uploadPhoto(bytesOfSize(PHOTO_LIMIT), "image/jpeg", owner)).status).toBe(201);
  });

  it("refuses an empty photo", async () => {
    expect((await uploadPhoto(new Uint8Array(0), "image/jpeg", owner)).status).toBe(422);
  });

  it("refuses a photo during an impersonation", async () => {
    expect((await uploadPhoto(bytesOfSize(64), "image/jpeg", impersonatedOwner)).status).toBe(403);
  });

  it("refuses a photo on the equipment of another organization", async () => {
    expect((await uploadPhoto(bytesOfSize(64), "image/jpeg", otherOwner)).status).toBe(404);
  });
});
