import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const idResponse = z.object({ id: z.string() });
const organizationResponse = z.object({ organization: idResponse });
const createdResponse = z.object({ customer: idResponse, site: idResponse });
const equipmentResponse = z.object({ equipment: idResponse });
const photoResponse = z.object({ photo: idResponse });
const fileResponse = z.object({
  customer: z.object({ lastName: z.string() }),
  sites: z.array(idResponse),
  equipments: z.array(z.object({ id: z.string(), status: z.string(), details: z.unknown() })),
  photos: z.array(z.record(z.string(), z.unknown())),
});
const pageResponse = z.object({
  customers: z.array(z.object({ id: z.string(), lastName: z.string().nullable() })),
  nextCursor: z.string().nullable(),
});

let platform: TestPlatform;
let owner: string;
let otherOwner: string;

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const createOrganization = async (cookie: string, name: string) => {
  const response = await platform.request("/api/organizations", json({ name }), cookie);
  const { organization } = organizationResponse.parse(await response.json());
  await platform.setActiveOrganization(cookie, organization.id);
  await platform.request(
    "/api/organization",
    json({ trades: ["chimney_sweeping", "boiler_maintenance", "heat_pump_maintenance"] }, "PATCH"),
    cookie,
  );
};

const createCustomer = async (lastName: string) => {
  const response = await platform.request(
    "/api/customers",
    json({
      customer: { kind: "individual", firstName: "Jean", lastName, phone: "06 12 34 56 78" },
      site: {
        address: "12 rue Paul Bert",
        postalCode: "94200",
        city: "Ivry",
        buildingType: "house",
      },
    }),
    owner,
  );
  expect(response.status).toBe(201);
  return createdResponse.parse(await response.json());
};

const fileOf = async (customerId: string, cookie = owner) =>
  platform.request(`/api/customers/${customerId}`, {}, cookie);

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-clients@example.fr");
  await createOrganization(owner, "Ramonage Lefèvre");
  otherOwner = await platform.signIn("autre-clients@example.fr");
  await createOrganization(otherOwner, "Autre Ramonage");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("customer routes", () => {
  it("creates, searches and reads a customer file", async () => {
    const { customer } = await createCustomer("Lefèvre");
    await createCustomer("Martin");
    const search = await platform.request("/api/customers?q=lefe", {}, owner);
    expect(pageResponse.parse(await search.json()).customers.map(({ id }) => id)).toEqual([
      customer.id,
    ]);
    const file = fileResponse.parse(await (await fileOf(customer.id)).json());
    expect(file.customer.lastName).toBe("Lefèvre");
    expect(file.sites).toHaveLength(1);
  });

  it("isolates customers between organizations", async () => {
    const { customer, site } = await createCustomer("Secret");
    expect((await fileOf(customer.id, otherOwner)).status).toBe(404);
    const list = await platform.request("/api/customers", {}, otherOwner);
    expect(pageResponse.parse(await list.json()).customers).toEqual([]);
    const patched = await platform.request(
      `/api/customers/${customer.id}`,
      json({ lastName: "Pirate" }, "PATCH"),
      otherOwner,
    );
    expect(patched.status).toBe(404);
    const equipment = await platform.request(
      `/api/sites/${site.id}/equipments`,
      json({ kind: "boiler" }),
      otherOwner,
    );
    expect(equipment.status).toBe(404);
  });

  it("replaces a boiler by a heat pump and stores a plate photo", async () => {
    const { customer, site } = await createCustomer("Durand");
    const boiler = equipmentResponse.parse(
      await (
        await platform.request(
          `/api/sites/${site.id}/equipments`,
          json({ kind: "boiler", energy: "gas", details: { flueType: "metal" } }),
          owner,
        )
      ).json(),
    );
    const heatPumpResponse = await platform.request(
      `/api/sites/${site.id}/equipments`,
      json({
        kind: "air_to_water_heat_pump",
        replacesEquipmentId: boiler.equipment.id,
        isInstalledByUs: true,
        details: { refrigerant: "r32" },
      }),
      owner,
    );
    expect(heatPumpResponse.status).toBe(201);
    const heatPump = equipmentResponse.parse(await heatPumpResponse.json());
    const upload = await platform.request(
      `/api/equipments/${heatPump.equipment.id}/photos?kind=plate`,
      {
        method: "POST",
        body: new Uint8Array([255, 216, 255, 224]),
        headers: { "content-type": "image/jpeg" },
      },
      owner,
    );
    expect(upload.status).toBe(201);
    const photo = photoResponse.parse(await upload.json());
    const file = fileResponse.parse(await (await fileOf(customer.id)).json());
    expect(file.equipments.map(({ status }) => status)).toEqual(["removed", "active"]);
    expect(file.equipments[1]?.details).toEqual({ refrigerant: "R32" });
    expect(file.photos[0]).not.toHaveProperty("storageKey");
    const image = await platform.request(`/api/photos/${photo.photo.id}`, {}, owner);
    expect(image.headers.get("content-type")).toBe("image/jpeg");
    expect((await platform.request(`/api/photos/${photo.photo.id}`, {}, otherOwner)).status).toBe(
      404,
    );
  });

  it("archives a customer with its sites and equipments", async () => {
    const { customer, site } = await createCustomer("Archive");
    await platform.request(`/api/sites/${site.id}/equipments`, json({ kind: "insert" }), owner);
    const archived = await platform.request(
      `/api/customers/${customer.id}`,
      { method: "DELETE" },
      owner,
    );
    expect(archived.status).toBe(204);
    expect((await fileOf(customer.id)).status).toBe(404);
    const patchSite = await platform.request(
      `/api/sites/${site.id}`,
      json({ city: "Créteil" }, "PATCH"),
      owner,
    );
    expect(patchSite.status).toBe(404);
  });

  it("validates the request body", async () => {
    const response = await platform.request(
      "/api/customers",
      json({ customer: { kind: "individual", lastName: "X" }, site: { postalCode: "123" } }),
      owner,
    );
    expect(response.status).toBe(400);
  });
});
