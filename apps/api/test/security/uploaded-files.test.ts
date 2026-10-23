import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createActiveOrganization, jsonRequest } from "./security-fixtures";

const MEGABYTE = 1024 * 1024;
const MALICIOUS_SVG = Uint8Array.from(
  new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  ),
);

const idResponse = z.object({ id: z.string() });
const createdCustomerResponse = z.object({ customer: idResponse, site: idResponse });
const equipmentResponse = z.object({ equipment: idResponse });
const photoResponse = z.object({ photo: idResponse });

let platform: TestPlatform;
let owner: string;
let organizationId: string;
let otherOwner: string;
let equipmentId: string;
let customerId: string;

const uploadLogo = (body: Uint8Array<ArrayBuffer>, contentType: string, cookie = owner) =>
  platform.request(
    "/api/organization/logo",
    { method: "PUT", body, headers: { "content-type": contentType } },
    cookie,
  );

const uploadPhoto = (body: Uint8Array<ArrayBuffer>, contentType: string) =>
  platform.request(
    `/api/equipments/${equipmentId}/photos?kind=plate`,
    { method: "POST", body, headers: { "content-type": contentType } },
    owner,
  );

const bytesOfSize = (size: number) => new Uint8Array(size).fill(1);

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-fichiers@example.fr");
  organizationId = await createActiveOrganization(platform, owner, "Ramonage Fichiers");
  await platform.request(
    "/api/organization",
    jsonRequest({ trades: ["boiler_maintenance"] }, "PATCH"),
    owner,
  );
  otherOwner = await platform.signIn("autre-fichiers@example.fr");
  await createActiveOrganization(platform, otherOwner, "Autre Fichiers");
  const created = await platform.request(
    "/api/customers",
    jsonRequest({
      customer: { kind: "individual", lastName: "Photo" },
      site: { address: "1 rue du Four", postalCode: "69003", city: "Lyon", buildingType: "house" },
    }),
    owner,
  );
  const { customer, site } = createdCustomerResponse.parse(await created.json());
  customerId = customer.id;
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

describe("organization logo", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])(
    "accepts a %s logo",
    async (contentType) => {
      expect((await uploadLogo(bytesOfSize(16), contentType)).status).toBe(204);
    },
  );

  it.each(["image/gif", "application/pdf", "text/html", "application/octet-stream"])(
    "refuses a %s logo",
    async (contentType) => {
      expect((await uploadLogo(bytesOfSize(16), contentType)).status).toBe(422);
    },
  );

  it("refuses a logo over 2 MB", async () => {
    expect((await uploadLogo(bytesOfSize(2 * MEGABYTE + 1), "image/png")).status).toBe(422);
  });

  it("stores the logo in R2 under organizations/{id}/logo", async () => {
    await uploadLogo(bytesOfSize(32), "image/webp");
    const stored = await platform.env.FILES.get(`organizations/${organizationId}/logo`);
    expect(stored?.size).toBe(32);
  });

  it("serves an SVG logo with default-src 'none' and nosniff", async () => {
    expect((await uploadLogo(MALICIOUS_SVG, "image/svg+xml")).status).toBe(204);
    const logo = await platform.request("/api/organization/logo", {}, owner);
    expect(logo.status).toBe(200);
    const policies = (logo.headers.get("content-security-policy") ?? "")
      .split(";")
      .map((directive) => directive.trim());
    expect(policies).toContain("default-src 'none'");
    expect(policies.some((directive) => directive.startsWith("script-src"))).toBe(false);
    expect(logo.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("serves the logo only to signed-in members", async () => {
    await uploadLogo(bytesOfSize(16), "image/png");
    const anonymous = await platform.request("/api/organization/logo");
    expect(anonymous.status).toBe(401);
    const outsider = await platform.request("/api/organization/logo", {}, otherOwner);
    expect(outsider.status).toBe(404);
  });

  it("never returns the R2 key of the logo", async () => {
    await uploadLogo(bytesOfSize(16), "image/png");
    const profile = await platform.request("/api/organization", {}, owner);
    const body = await profile.text();
    expect(body).not.toContain("organizations/");
    expect(body.toLowerCase()).not.toContain("logokey");
  });
});

describe("equipment photo", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts a %s photo", async (contentType) => {
    expect((await uploadPhoto(bytesOfSize(64), contentType)).status).toBe(201);
  });

  it.each(["image/svg+xml", "image/gif", "application/pdf", "text/html"])(
    "refuses a %s photo",
    async (contentType) => {
      expect((await uploadPhoto(bytesOfSize(64), contentType)).status).toBe(422);
    },
  );

  it("refuses a photo over 5 MB", async () => {
    expect((await uploadPhoto(bytesOfSize(5 * MEGABYTE + 1), "image/jpeg")).status).toBe(422);
  });

  it("never returns the R2 key of a photo", async () => {
    const upload = await uploadPhoto(bytesOfSize(64), "image/jpeg");
    const uploadBody = await upload.text();
    const { photo } = photoResponse.parse(JSON.parse(uploadBody));
    const file = await (await platform.request(`/api/customers/${customerId}`, {}, owner)).text();
    const pulled = await (await platform.request("/api/sync/pull", {}, owner)).text();
    const responses = [uploadBody, file, pulled];
    expect(file).toContain(photo.id);
    expect(pulled).toContain(photo.id);
    expect(responses.filter((body) => body.includes("organizations/"))).toEqual([]);
    expect(responses.filter((body) => body.toLowerCase().includes("storagekey"))).toEqual([]);
  });
});
