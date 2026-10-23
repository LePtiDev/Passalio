import type { CustomerMutation } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });
const pushResponse = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["applied", "rejected"]),
      error: z.string().optional(),
    }),
  ),
});
const row = z.object({ id: z.string(), deletedAt: z.string().nullable() }).loose();
const pullResponse = z.object({
  changes: z.object({
    customers: z.array(row),
    sites: z.array(row),
    equipments: z.array(row),
    photos: z.array(row),
  }),
  cursor: z.string(),
  hasMore: z.boolean(),
});
const errorResponse = z.object({ error: z.string(), traceId: z.string() });

type PulledPage = z.infer<typeof pullResponse>;

const uuidOf = (prefix: number, index: number) =>
  `0190f3a0-0000-7000-8${String(prefix).padStart(3, "0")}-${String(index).padStart(12, "0")}`;

const CUSTOMER_A = uuidOf(10, 1);
const SITE_A = uuidOf(10, 2);
const EQUIPMENT_A = uuidOf(10, 3);
const PHOTO_A = uuidOf(10, 4);
const ORIGINAL_NAME = "Client A";

let platform: TestPlatform;
let ownerA: string;
let impersonatedOwnerA: string;
let technicianA: string;
let secretaryA: string;
let ownerB: string;
let organizationA: string;
let envelopeCounter = 0;

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const expectStatus = (response: Response, status: number) => {
  if (response.status !== status) {
    throw new Error(`Expected ${status}, received ${response.status}`);
  }
};

const createOrganization = async (cookie: string, name: string) => {
  const response = await platform.request("/api/organizations", json({ name }), cookie);
  expectStatus(response, 201);
  const { organization } = organizationResponse.parse(await response.json());
  expectStatus(await platform.setActiveOrganization(cookie, organization.id), 200);
  await platform.request(
    "/api/organization",
    json({ trades: ["chimney_sweeping"] }, "PATCH"),
    cookie,
  );
  return organization.id;
};

const joinAs = async (email: string, role: "technician" | "secretary") => {
  expectStatus(await platform.request("/api/invitations", json({ email, role }), ownerA), 201);
  const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
  const cookie = await platform.signIn(email);
  expectStatus(
    await platform.request(`/api${invitationPath}/accept`, { method: "POST" }, cookie),
    201,
  );
  expectStatus(await platform.setActiveOrganization(cookie, organizationA), 200);
  return cookie;
};

const impersonate = async (cookie: string) => {
  const token = decodeURIComponent(cookie.split("=")[1] ?? "").split(".")[0];
  await platform.signIn("support-sync@example.fr");
  await platform.env.DB.prepare(
    "UPDATE sessions SET impersonated_by = (SELECT id FROM users WHERE email = 'support-sync@example.fr'), impersonation_reason = 'Demande de support' WHERE token = ?",
  )
    .bind(token)
    .run();
};

const envelopesOf = (mutations: readonly CustomerMutation[]) =>
  mutations.map((mutation) => ({ id: uuidOf(990, (envelopeCounter += 1)), mutation }));

const pushRaw = (cookie: string | undefined, body: unknown) =>
  platform.request("/api/sync/push", json(body), cookie);

const push = async (cookie: string, mutations: readonly CustomerMutation[]) => {
  const response = await pushRaw(cookie, { mutations: envelopesOf(mutations) });
  expectStatus(response, 200);
  return pushResponse
    .parse(await response.json())
    .results.map(({ status, error }) => (error === undefined ? status : `${status}:${error}`));
};

const pullRaw = (cookie: string | undefined, cursor?: string) =>
  platform.request(
    cursor === undefined ? "/api/sync/pull" : `/api/sync/pull?cursor=${cursor}`,
    {},
    cookie,
  );

const pullAll = async (
  cookie: string,
  from?: string,
  pages: readonly PulledPage[] = [],
): Promise<readonly PulledPage[]> => {
  const response = await pullRaw(cookie, from);
  expectStatus(response, 200);
  const page = pullResponse.parse(await response.json());
  return page.hasMore ? pullAll(cookie, page.cursor, [...pages, page]) : [...pages, page];
};

const pulledRows = async (cookie: string, table: keyof PulledPage["changes"], from?: string) =>
  (await pullAll(cookie, from)).flatMap(({ changes }) => changes[table]);

const customerOfA = async () =>
  (await pulledRows(ownerA, "customers")).find(({ id }) => id === CUSTOMER_A);

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

const creationOf = (customerId: string, lastName: string): CustomerMutation => ({
  type: "create_customer",
  customerId,
  customer: { kind: "individual", lastName },
});

const siteOf = (siteId: string, customerId: string): CustomerMutation => ({
  type: "add_site",
  siteId,
  customerId,
  site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
});

const equipmentOf = (equipmentId: string, siteId: string): CustomerMutation => ({
  type: "add_equipment",
  equipmentId,
  siteId,
  equipment: { kind: "insert" },
});

const uploadPhoto = (cookie: string, equipmentId: string, photoId: string) =>
  platform.request(
    `/api/equipments/${equipmentId}/photos?id=${photoId}&kind=plate`,
    {
      method: "POST",
      body: new Uint8Array([255, 216, 255, 224]),
      headers: { "content-type": "image/jpeg" },
    },
    cookie,
  );

beforeAll(async () => {
  platform = await startTestPlatform();
  ownerA = await platform.signIn("patron-acces-sync@example.fr");
  organizationA = await createOrganization(ownerA, "Ramonage Accès A");
  impersonatedOwnerA = await platform.signIn("patron-acces-sync@example.fr");
  expectStatus(await platform.setActiveOrganization(impersonatedOwnerA, organizationA), 200);
  technicianA = await joinAs("tech-acces-sync@example.fr", "technician");
  secretaryA = await joinAs("secretariat-acces-sync@example.fr", "secretary");
  ownerB = await platform.signIn("patron-acces-sync-b@example.fr");
  await createOrganization(ownerB, "Ramonage Accès B");
  const seeded = await push(ownerA, [
    creationOf(CUSTOMER_A, ORIGINAL_NAME),
    siteOf(SITE_A, CUSTOMER_A),
    equipmentOf(EQUIPMENT_A, SITE_A),
  ]);
  if (seeded.some((result) => result !== "applied")) {
    throw new Error(`Seed refused: ${seeded.join(", ")}`);
  }
  expectStatus(await uploadPhoto(ownerA, EQUIPMENT_A, PHOTO_A), 201);
  await impersonate(impersonatedOwnerA);
}, 90_000);

afterAll(async () => {
  await platform.dispose();
});

describe("sync routes without a session", () => {
  it("refuses a push without a session and applies nothing", async () => {
    const response = await pushRaw(undefined, {
      mutations: envelopesOf([creationOf(uuidOf(11, 1), "Anonyme")]),
    });
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toBe("unauthenticated");
    expect((await pulledRows(ownerA, "customers")).some(({ id }) => id === uuidOf(11, 1))).toBe(
      false,
    );
  });

  it("refuses a pull without a session", async () => {
    const response = await pullRaw(undefined);
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toBe("unauthenticated");
  });
});

describe("sync routes during an impersonation", () => {
  it("refuses every pushed mutation and changes nothing", async () => {
    const response = await pushRaw(impersonatedOwnerA, {
      mutations: envelopesOf([
        creationOf(uuidOf(12, 1), "Imposteur"),
        { type: "update_customer", customerId: CUSTOMER_A, changes: { lastName: "Imposteur" } },
        { type: "archive_customer", customerId: CUSTOMER_A },
      ]),
    });
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("impersonation_read_only");
    const customers = await pulledRows(ownerA, "customers");
    expect(customers.some(({ id }) => id === uuidOf(12, 1))).toBe(false);
    expect(await customerOfA()).toMatchObject({ lastName: ORIGINAL_NAME, deletedAt: null });
  });

  it("refuses a photo upload", async () => {
    const response = await uploadPhoto(impersonatedOwnerA, EQUIPMENT_A, uuidOf(12, 2));
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("impersonation_read_only");
    expect((await pulledRows(ownerA, "photos")).some(({ id }) => id === uuidOf(12, 2))).toBe(false);
  });

  it("still lets the support read the organization data through pull", async () => {
    const customers = await pulledRows(impersonatedOwnerA, "customers");
    expect(customers.map(({ id }) => id)).toContain(CUSTOMER_A);
  });
});

describe("sync push per role", () => {
  it("lets a technician create and update, but refuses an archive", async () => {
    const customerId = uuidOf(13, 1);
    expect(
      await push(technicianA, [
        creationOf(customerId, "Client du technicien"),
        { type: "update_customer", customerId, changes: { phone: "06 11 22 33 44" } },
        { type: "archive_customer", customerId },
      ]),
    ).toEqual(["applied", "applied", "rejected:forbidden"]);
    const customer = (await pulledRows(ownerA, "customers")).find(({ id }) => id === customerId);
    expect(customer).toMatchObject({ phone: "06 11 22 33 44", deletedAt: null });
  });

  it("lets a secretary archive a customer", async () => {
    const customerId = uuidOf(13, 2);
    expect(
      await push(secretaryA, [
        creationOf(customerId, "Client du secrétariat"),
        { type: "archive_customer", customerId },
      ]),
    ).toEqual(["applied", "applied"]);
    const customer = (await pulledRows(ownerA, "customers")).find(({ id }) => id === customerId);
    expect(customer?.deletedAt).not.toBeNull();
  });

  it("lets a technician pull the organization data", async () => {
    expect((await pulledRows(technicianA, "equipments")).map(({ id }) => id)).toContain(
      EQUIPMENT_A,
    );
  });
});

describe("sync isolation between organizations", () => {
  it("refuses every change pushed by another organization on its records", async () => {
    expect(
      await push(ownerB, [
        { type: "update_customer", customerId: CUSTOMER_A, changes: { lastName: "Pirate" } },
        { type: "archive_customer", customerId: CUSTOMER_A },
        siteOf(uuidOf(14, 1), CUSTOMER_A),
        { type: "update_site", siteId: SITE_A, changes: { city: "Pirate" } },
        equipmentOf(uuidOf(14, 2), SITE_A),
        { type: "update_equipment", equipmentId: EQUIPMENT_A, changes: { brand: "Pirate" } },
        { type: "remove_equipment", equipmentId: EQUIPMENT_A },
      ]),
    ).toEqual([
      "rejected:customer_not_found",
      "rejected:customer_not_found",
      "rejected:customer_not_found",
      "rejected:site_not_found",
      "rejected:site_not_found",
      "rejected:equipment_not_found",
      "rejected:equipment_not_found",
    ]);
    expect(await customerOfA()).toMatchObject({ lastName: ORIGINAL_NAME, deletedAt: null });
    expect((await pulledRows(ownerA, "sites")).find(({ id }) => id === SITE_A)?.city).toBe("Ivry");
    expect(
      (await pulledRows(ownerA, "equipments")).find(({ id }) => id === EQUIPMENT_A),
    ).toMatchObject({ brand: null, status: "active", deletedAt: null });
  });

  it("does not report as applied a creation that reuses the id of another organization's record", async () => {
    const results = await push(ownerB, [
      creationOf(CUSTOMER_A, "Pirate"),
      siteOf(SITE_A, CUSTOMER_A),
      equipmentOf(EQUIPMENT_A, SITE_A),
    ]);
    expect(results.every((result) => result.startsWith("rejected"))).toBe(true);
    expect(await pulledRows(ownerB, "customers")).toEqual([]);
    expect(await customerOfA()).toMatchObject({ lastName: ORIGINAL_NAME });
  });

  it("refuses a photo sent by another organization to its equipment", async () => {
    expect((await uploadPhoto(ownerB, EQUIPMENT_A, uuidOf(14, 3))).status).toBe(404);
    expect((await pulledRows(ownerA, "photos")).map(({ id }) => id)).toEqual([PHOTO_A]);
  });

  it("pulls nothing from another organization, even with its cursor", async () => {
    const pagesOfA = await pullAll(ownerA);
    const cursorOfA = pagesOfA.at(-1)?.cursor;
    const pages = await pullAll(ownerB);
    const firstCursor = (await pullAll(ownerB, cursorOfA)).flatMap(({ changes }) => [
      ...changes.customers,
      ...changes.sites,
      ...changes.equipments,
      ...changes.photos,
    ]);
    const everything = pages.flatMap(({ changes }) => [
      ...changes.customers,
      ...changes.sites,
      ...changes.equipments,
      ...changes.photos,
    ]);
    expect(everything).toEqual([]);
    expect(firstCursor).toEqual([]);
  });
});

describe("sync pull of photos", () => {
  it("never sends the storage key of a photo to the browser", async () => {
    const pages = await pullAll(ownerA);
    const photos = pages.flatMap(({ changes }) => changes.photos);
    expect(photos.map(({ id }) => id)).toEqual([PHOTO_A]);
    expect(Object.keys(photos[0] ?? {})).not.toContain("storageKey");
    expect(JSON.stringify(pages)).not.toContain("equipment-photos/");
  });
});

describe("sync push validation", () => {
  it("refuses an empty batch", async () => {
    expect((await pushRaw(ownerA, { mutations: [] })).status).toBe(400);
  });

  it("refuses the whole batch when one mutation is invalid, without applying the valid ones", async () => {
    const validId = uuidOf(15, 1);
    const response = await pushRaw(ownerA, {
      mutations: [
        ...envelopesOf([creationOf(validId, "Valide")]),
        { id: uuidOf(15, 2), mutation: { type: "create_customer", customerId: "pas-un-uuid" } },
      ],
    });
    expect(response.status).toBe(400);
    expect((await pulledRows(ownerA, "customers")).some(({ id }) => id === validId)).toBe(false);
  });

  it("refuses a mutation envelope whose id is not a uuid", async () => {
    const response = await pushRaw(ownerA, {
      mutations: [{ id: "1", mutation: creationOf(uuidOf(15, 3), "Sans identifiant") }],
    });
    expect(response.status).toBe(400);
  });
});

const encode = (value: unknown) =>
  btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

describe("sync pull cursor validation", () => {
  it.each([
    ["an unknown table", encode({ invoices: [0, "x"] })],
    ["a negative date", encode({ customers: [-1, "x"] })],
    ["an empty id", encode({ customers: [0, ""] })],
    ["a cursor that is not json", encode("x").slice(0, 3)],
  ])("refuses a cursor with %s", async (_, cursor) => {
    const response = await pullRaw(ownerA, cursor);
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("invalid_request");
  });

  it("refuses a cursor longer than 2000 characters", async () => {
    expect((await pullRaw(ownerA, "a".repeat(2001))).status).toBe(400);
  });
});
