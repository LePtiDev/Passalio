import type { CustomerMutation } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { PHOTO_BYTES, seedCompanyData, type CompanyData } from "./company-data-fixture";
import { createOrganization } from "./matrix-sessions";
import { MEMBER_ROUTES, USER_ROUTES } from "./route-declarations";
import { sendSample } from "./route-samples";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const fileResponse = z.object({
  customer: z.object({ lastName: z.string().nullable() }).loose(),
  sites: z.array(z.object({ id: z.string(), city: z.string() }).loose()),
  equipments: z.array(
    z.object({ id: z.string(), brand: z.string().nullable(), status: z.string() }).loose(),
  ),
  photos: z.array(z.object({ id: z.string() }).loose()),
});
const membersResponse = z.object({
  members: z.array(z.object({ email: z.string(), role: z.string() })),
});
const invitationsResponse = z.object({ invitations: z.array(z.object({ email: z.string() })) });
const row = z.object({ id: z.string() }).loose();
const pullResponse = z.object({
  changes: z.object({
    customers: z.array(row),
    sites: z.array(row),
    equipments: z.array(row),
    photos: z.array(row),
  }),
});
const pushResponse = z.object({ results: z.array(z.object({ status: z.string() })) });

const FOREIGN_RESOURCE_ROUTES = [...USER_ROUTES, ...MEMBER_ROUTES].filter(
  ({ foreignResourceStatus }) => foreignResourceStatus !== null,
);

let platform: TestPlatform;
let companyA: CompanyData;
let ownerB: string;
let organizationB: string;

const fileOfA = async () => {
  const response = await platform.request(
    `/api/customers/${companyA.ids.customerId}`,
    {},
    companyA.ownerCookie,
  );
  expect(response.status).toBe(200);
  return fileResponse.parse(await response.json());
};

beforeAll(async () => {
  platform = await startTestPlatform();
  companyA = await seedCompanyData(platform, "isolation-a");
  ownerB = await platform.signIn("patron-isolation-b@example.fr");
  organizationB = await createOrganization(platform, ownerB, "Ramonage Isolation B");
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("a member of B on the resources of A", () => {
  it.each(FOREIGN_RESOURCE_ROUTES)(
    "$method $path answers $foreignResourceStatus",
    async (route) => {
      const response = await sendSample(platform, route, companyA.ids, ownerB);
      expect(response.status).toBe(route.foreignResourceStatus);
      expect(errorResponse.parse(await response.json()).traceId).not.toBe("");
    },
  );

  it("leaves the customer, site, equipment and photo of A untouched", async () => {
    const file = await fileOfA();
    expect(file.customer).toMatchObject({ lastName: "Client isolation-a" });
    expect(file.sites.map(({ id, city }) => [id, city])).toEqual([[companyA.ids.siteId, "Paris"]]);
    expect(file.equipments.map(({ brand, status }) => [brand, status])).toEqual([
      ["Marque d'origine", "active"],
    ]);
    expect(file.photos.map(({ id }) => id)).toEqual([companyA.ids.photoId]);
  });

  it("leaves the team and pending invitations of A untouched", async () => {
    const members = membersResponse.parse(
      await (await platform.request("/api/members", {}, companyA.ownerCookie)).json(),
    );
    expect(members.members).toContainEqual({
      email: companyA.technicianEmail,
      role: "technician",
    });
    const invitations = invitationsResponse.parse(
      await (await platform.request("/api/invitations", {}, companyA.ownerCookie)).json(),
    );
    expect(invitations.invitations.map(({ email }) => email)).toContain(companyA.pendingEmail);
  });

  it("never downloads the photo of A", async () => {
    const own = await platform.request(
      `/api/photos/${companyA.ids.photoId}`,
      {},
      companyA.ownerCookie,
    );
    expect(new Uint8Array(await own.arrayBuffer())).toEqual(PHOTO_BYTES);
    const foreign = await platform.request(`/api/photos/${companyA.ids.photoId}`, {}, ownerB);
    expect(foreign.status).toBe(404);
  });

  it("never downloads the logo of A", async () => {
    const response = await platform.request("/api/organization/logo", {}, ownerB);
    expect(response.status).toBe(404);
  });

  it("cannot switch to the organization of A", async () => {
    const response = await platform.setActiveOrganization(ownerB, companyA.ids.organizationId);
    expect(response.status).toBe(403);
    expect((await platform.setActiveOrganization(ownerB, organizationB)).status).toBe(200);
  });
});

describe("synchronization between organizations", () => {
  it("never pulls a row of A", async () => {
    const { changes } = pullResponse.parse(
      await (await platform.request("/api/sync/pull", {}, ownerB)).json(),
    );
    const pulledIds = [
      ...changes.customers,
      ...changes.sites,
      ...changes.equipments,
      ...changes.photos,
    ].map(({ id }) => id);
    expect(pulledIds).not.toContain(companyA.ids.customerId);
    expect(pulledIds).not.toContain(companyA.ids.siteId);
    expect(pulledIds).not.toContain(companyA.ids.equipmentId);
    expect(pulledIds).not.toContain(companyA.ids.photoId);
  });

  it("rejects every pushed change aimed at A and leaves A untouched", async () => {
    const { customerId, siteId, equipmentId } = companyA.ids;
    const site = {
      address: "9 rue Basse",
      postalCode: "75005",
      city: "Paris",
      buildingType: "apartment",
    } as const;
    const mutations: readonly CustomerMutation[] = [
      { type: "update_customer", customerId, changes: { lastName: "Intrus" } },
      { type: "add_site", siteId: crypto.randomUUID(), customerId, site },
      { type: "update_site", siteId, changes: { city: "Intrusville" } },
      {
        type: "add_equipment",
        equipmentId: crypto.randomUUID(),
        siteId,
        equipment: { kind: "boiler" },
      },
      { type: "update_equipment", equipmentId, changes: { brand: "Intrus" } },
      { type: "remove_equipment", equipmentId },
      { type: "archive_customer", customerId },
    ];
    const response = await platform.request(
      "/api/sync/push",
      {
        method: "POST",
        body: JSON.stringify({
          mutations: mutations.map((mutation) => ({ id: crypto.randomUUID(), mutation })),
        }),
      },
      ownerB,
    );
    expect(response.status).toBe(200);
    const { results } = pushResponse.parse(await response.json());
    expect(results.map(({ status }) => status)).toEqual(mutations.map(() => "rejected"));
    const file = await fileOfA();
    expect(file.customer).toMatchObject({ lastName: "Client isolation-a" });
    expect(file.sites).toHaveLength(1);
    expect(file.equipments.map(({ brand, status }) => [brand, status])).toEqual([
      ["Marque d'origine", "active"],
    ]);
  });

  it("does not let B reuse the identifier of a customer of A", async () => {
    const response = await platform.request(
      "/api/sync/push",
      {
        method: "POST",
        body: JSON.stringify({
          mutations: [
            {
              id: crypto.randomUUID(),
              mutation: {
                type: "create_customer",
                customerId: companyA.ids.customerId,
                customer: { kind: "individual", lastName: "Usurpateur" },
              },
            },
          ],
        }),
      },
      ownerB,
    );
    expect(response.status).toBe(200);
    const file = await fileOfA();
    expect(file.customer).toMatchObject({ lastName: "Client isolation-a" });
  });
});
