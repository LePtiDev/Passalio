import type { CustomerMutation } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { PHOTO_BYTES, seedCompanyData, type CompanyData } from "./company-data-fixture";
import { createOrganization } from "./matrix-sessions";

const idResponse = z.object({ id: z.string() });
const createdCustomer = z.object({ customer: idResponse, site: idResponse });
const createdEquipment = z.object({ equipment: idResponse });
const fileResponse = z.object({
  customer: z.object({ id: z.string(), lastName: z.string().nullable() }).loose(),
  sites: z.array(z.object({ id: z.string(), city: z.string(), address: z.string() }).loose()),
  equipments: z.array(
    z.object({ id: z.string(), brand: z.string().nullable(), status: z.string() }).loose(),
  ),
  photos: z.array(z.object({ id: z.string() }).loose()),
});
const customersPage = z.object({ customers: z.array(z.object({ id: z.string() }).loose()) });
const membersResponse = z.object({ members: z.array(z.object({ email: z.string() }).loose()) });
const invitationsResponse = z.object({
  invitations: z.array(z.object({ email: z.string() }).loose()),
});
const organizationResponse = z.object({
  organization: z.object({ id: z.string(), name: z.string() }).loose(),
});
const pullResponse = z.object({
  changes: z.object({
    customers: z.array(z.object({ id: z.string() }).loose()),
    sites: z.array(z.object({ id: z.string() }).loose()),
    equipments: z.array(z.object({ id: z.string() }).loose()),
    photos: z.array(z.object({ id: z.string() }).loose()),
  }),
});
const pushResponse = z.object({ results: z.array(z.object({ status: z.string() }).loose()) });

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const SITE_OF_B = {
  address: "8 rue de B",
  postalCode: "69001",
  city: "Lyon",
  buildingType: "house",
} as const;

let platform: TestPlatform;
let companyA: CompanyData;
let ownerB: string;
let organizationB: string;
let customerOfB: string;
let siteOfB: string;
let equipmentOfB: string;

const fileOfA = async () => {
  const response = await platform.request(
    `/api/customers/${companyA.ids.customerId}`,
    {},
    companyA.ownerCookie,
  );
  expect(response.status).toBe(200);
  return fileResponse.parse(await response.json());
};

const expectAUntouched = async () => {
  const file = await fileOfA();
  expect(file.customer.lastName).toBe("Client isolation-ids-a");
  expect(file.sites.map(({ id, city, address }) => [id, city, address])).toEqual([
    [companyA.ids.siteId, "Paris", "1 rue Haute"],
  ]);
  expect(file.equipments.map(({ id, brand, status }) => [id, brand, status])).toEqual([
    [companyA.ids.equipmentId, "Marque d'origine", "active"],
  ]);
  expect(file.photos.map(({ id }) => id)).toEqual([companyA.ids.photoId]);
  const photo = await platform.request(
    `/api/photos/${companyA.ids.photoId}`,
    {},
    companyA.ownerCookie,
  );
  expect(new Uint8Array(await photo.arrayBuffer())).toEqual(PHOTO_BYTES);
};

const pushAsB = async (mutations: readonly CustomerMutation[]) => {
  const response = await platform.request(
    "/api/sync/push",
    json({ mutations: mutations.map((mutation) => ({ id: crypto.randomUUID(), mutation })) }),
    ownerB,
  );
  expect(response.status).toBe(200);
  return pushResponse.parse(await response.json()).results.map(({ status }) => status);
};

beforeAll(async () => {
  platform = await startTestPlatform();
  companyA = await seedCompanyData(platform, "isolation-ids-a");
  ownerB = await platform.signIn("patron-isolation-ids-b@example.fr");
  organizationB = await createOrganization(platform, ownerB, "Ramonage Identifiants B");
  const created = createdCustomer.parse(
    await (
      await platform.request(
        "/api/customers",
        json({ customer: { kind: "individual", lastName: "Client de B" }, site: SITE_OF_B }),
        ownerB,
      )
    ).json(),
  );
  customerOfB = created.customer.id;
  siteOfB = created.site.id;
  equipmentOfB = createdEquipment.parse(
    await (
      await platform.request(`/api/sites/${siteOfB}/equipments`, json({ kind: "boiler" }), ownerB)
    ).json(),
  ).equipment.id;
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("lists of B never show the data of A", () => {
  it("lists only the customers of B", async () => {
    const page = customersPage.parse(
      await (await platform.request("/api/customers", {}, ownerB)).json(),
    );
    expect(page.customers.map(({ id }) => id)).toEqual([customerOfB]);
  });

  it("finds no customer of A when B searches for its name", async () => {
    const page = customersPage.parse(
      await (await platform.request("/api/customers?q=Client%20isolation", {}, ownerB)).json(),
    );
    expect(page.customers).toEqual([]);
  });

  it("lists only the members of B", async () => {
    const { members } = membersResponse.parse(
      await (await platform.request("/api/members", {}, ownerB)).json(),
    );
    expect(members.map(({ email }) => email)).toEqual(["patron-isolation-ids-b@example.fr"]);
  });

  it("lists none of the pending invitations of A", async () => {
    const { invitations } = invitationsResponse.parse(
      await (await platform.request("/api/invitations", {}, ownerB)).json(),
    );
    expect(invitations.map(({ email }) => email)).not.toContain(companyA.pendingEmail);
  });

  it("shows the settings of B, never those of A", async () => {
    const { organization } = organizationResponse.parse(
      await (await platform.request("/api/organization", {}, ownerB)).json(),
    );
    expect(organization).toMatchObject({ id: organizationB, name: "Ramonage Identifiants B" });
  });
});

describe("B choosing the identifiers of A for its own records", () => {
  it("cannot create a customer under the identifier of a customer of A", async () => {
    const response = await platform.request(
      "/api/customers",
      json({
        id: companyA.ids.customerId,
        customer: { kind: "individual", lastName: "Usurpateur" },
        site: { ...SITE_OF_B, id: companyA.ids.siteId },
      }),
      ownerB,
    );
    expect(response.ok).toBe(false);
    await expectAUntouched();
  });

  it("cannot add a site under the identifier of a site of A", async () => {
    const response = await platform.request(
      `/api/customers/${customerOfB}/sites`,
      json({ ...SITE_OF_B, id: companyA.ids.siteId }),
      ownerB,
    );
    expect(response.ok).toBe(false);
    await expectAUntouched();
  });

  it("cannot add an equipment under the identifier of an equipment of A", async () => {
    const response = await platform.request(
      `/api/sites/${siteOfB}/equipments`,
      json({ kind: "boiler", brand: "Usurpateur", id: companyA.ids.equipmentId }),
      ownerB,
    );
    expect(response.ok).toBe(false);
    await expectAUntouched();
  });

  it("cannot replace an equipment of A with an equipment of B", async () => {
    const response = await platform.request(
      `/api/sites/${siteOfB}/equipments`,
      json({ kind: "boiler", replacesEquipmentId: companyA.ids.equipmentId }),
      ownerB,
    );
    expect(response.status).toBe(404);
    await expectAUntouched();
  });

  it("cannot upload a photo under the identifier of a photo of A", async () => {
    const response = await platform.request(
      `/api/equipments/${equipmentOfB}/photos?kind=plate&id=${companyA.ids.photoId}`,
      {
        method: "POST",
        body: new Uint8Array([255, 216, 255, 225]),
        headers: { "content-type": "image/jpeg" },
      },
      ownerB,
    );
    expect(response.ok).toBe(false);
    await expectAUntouched();
  });

  it("rejects offline changes that reuse the identifiers of A and leaves A untouched", async () => {
    const statuses = await pushAsB([
      {
        type: "add_site",
        siteId: companyA.ids.siteId,
        customerId: customerOfB,
        site: SITE_OF_B,
      },
      {
        type: "add_equipment",
        equipmentId: companyA.ids.equipmentId,
        siteId: siteOfB,
        equipment: { kind: "boiler", brand: "Usurpateur" },
      },
    ]);
    expect(statuses).toEqual(["rejected", "rejected"]);
    await expectAUntouched();
  });

  it("never pulls a row of A after trying to reuse its identifiers", async () => {
    const { changes } = pullResponse.parse(
      await (await platform.request("/api/sync/pull", {}, ownerB)).json(),
    );
    const pulledIds = [
      ...changes.customers,
      ...changes.sites,
      ...changes.equipments,
      ...changes.photos,
    ].map(({ id }) => id);
    expect(pulledIds).toEqual(expect.arrayContaining([customerOfB, siteOfB, equipmentOfB]));
    const { customerId, siteId, equipmentId, photoId } = companyA.ids;
    const idsOfA = new Set([customerId, siteId, equipmentId, photoId]);
    expect(pulledIds.filter((id) => idsOfA.has(id))).toEqual([]);
  });
});

describe("a person who belongs to two organizations", () => {
  let twoCompanies: string;
  let organizationC: string;
  let customerOfC: string;

  beforeAll(async () => {
    twoCompanies = await platform.signIn(companyA.technicianEmail);
    organizationC = await createOrganization(platform, twoCompanies, "Ramonage Double C");
    customerOfC = createdCustomer.parse(
      await (
        await platform.request(
          "/api/customers",
          json({ customer: { kind: "individual", lastName: "Client de C" }, site: SITE_OF_B }),
          twoCompanies,
        )
      ).json(),
    ).customer.id;
  }, 60_000);

  it("does not reach the customers of A while C is active", async () => {
    const read = await platform.request(
      `/api/customers/${companyA.ids.customerId}`,
      {},
      twoCompanies,
    );
    expect(read.status).toBe(404);
    const archived = await platform.request(
      `/api/customers/${companyA.ids.customerId}`,
      { method: "DELETE" },
      twoCompanies,
    );
    expect(archived.status).toBe(404);
    await expectAUntouched();
  });

  it("keeps the technician role of A when A is active, even though it owns C", async () => {
    expect(
      (await platform.setActiveOrganization(twoCompanies, companyA.ids.organizationId)).status,
    ).toBe(200);
    const archived = await platform.request(
      `/api/customers/${companyA.ids.customerId}`,
      { method: "DELETE" },
      twoCompanies,
    );
    expect(archived.status).toBe(403);
    const settings = await platform.request(
      "/api/organization",
      json({ name: "Repris par le technicien" }, "PATCH"),
      twoCompanies,
    );
    expect(settings.status).toBe(403);
    const readC = await platform.request(`/api/customers/${customerOfC}`, {}, twoCompanies);
    expect(readC.status).toBe(404);
    await expectAUntouched();
  });

  it("gets back the owner role of C when C is active again", async () => {
    expect((await platform.setActiveOrganization(twoCompanies, organizationC)).status).toBe(200);
    const archived = await platform.request(
      `/api/customers/${customerOfC}`,
      { method: "DELETE" },
      twoCompanies,
    );
    expect(archived.status).toBe(204);
  });
});
