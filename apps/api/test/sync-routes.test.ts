import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });
const pushResponse = z.object({
  results: z.array(z.object({ id: z.string(), status: z.string(), error: z.string().optional() })),
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

const CUSTOMER_ID = "0190f3a0-0000-7000-8000-00000000c001";
const SITE_ID = "0190f3a0-0000-7000-8000-00000000c002";
const EQUIPMENT_ID = "0190f3a0-0000-7000-8000-00000000c003";
const mutationId = (index: number) => `0190f3a0-0000-7000-8000-${String(index).padStart(12, "0")}`;

let platform: TestPlatform;
let owner: string;
let otherOwner: string;

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const createOrganization = async (cookie: string, name: string, trades: string[]) => {
  const response = await platform.request("/api/organizations", json({ name }), cookie);
  const { organization } = organizationResponse.parse(await response.json());
  await platform.setActiveOrganization(cookie, organization.id);
  await platform.request("/api/organization", json({ trades }, "PATCH"), cookie);
};

const push = async (cookie: string, mutations: readonly unknown[]) => {
  const response = await platform.request(
    "/api/sync/push",
    json({
      mutations: mutations.map((mutation, index) => ({ id: mutationId(index + 1), mutation })),
    }),
    cookie,
  );
  return pushResponse
    .parse(await response.json())
    .results.map(({ status, error }) => (error === undefined ? status : `${status}:${error}`));
};

const pull = async (cookie: string, cursor?: string) => {
  const query = cursor === undefined ? "" : `?cursor=${cursor}`;
  return pullResponse.parse(
    await (await platform.request(`/api/sync/pull${query}`, {}, cookie)).json(),
  );
};

const offlineCreation = [
  {
    type: "create_customer",
    customerId: CUSTOMER_ID,
    customer: { kind: "individual", lastName: "Hors-ligne" },
  },
  {
    type: "add_site",
    siteId: SITE_ID,
    customerId: CUSTOMER_ID,
    site: {
      address: "1 rue du Port",
      postalCode: "94100",
      city: "Saint-Maur",
      buildingType: "house",
    },
  },
  {
    type: "add_equipment",
    equipmentId: EQUIPMENT_ID,
    siteId: SITE_ID,
    equipment: { kind: "insert" },
  },
];

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-sync@example.fr");
  await createOrganization(owner, "Ramonage Sync", ["chimney_sweeping"]);
  otherOwner = await platform.signIn("autre-sync@example.fr");
  await createOrganization(otherOwner, "Autre Sync", ["chimney_sweeping"]);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("sync push and pull", () => {
  it("applies offline mutations in order and accepts the same push twice", async () => {
    expect(await push(owner, offlineCreation)).toEqual(["applied", "applied", "applied"]);
    expect(await push(owner, offlineCreation)).toEqual(["applied", "applied", "applied"]);
  });

  it("rejects one mutation without blocking the next ones", async () => {
    const results = await push(owner, [
      {
        type: "add_equipment",
        equipmentId: mutationId(90),
        siteId: SITE_ID,
        equipment: { kind: "air_conditioner" },
      },
      { type: "update_customer", customerId: CUSTOMER_ID, changes: { phone: "06 00 00 00 00" } },
    ]);
    expect(results).toEqual(["rejected:equipment_kind_not_offered", "applied"]);
  });

  it("pulls everything, then only what changed after the cursor", async () => {
    const first = await pull(owner);
    expect(first.changes.customers.map(({ id }) => id)).toEqual([CUSTOMER_ID]);
    expect(first.changes.equipments.map(({ id }) => id)).toEqual([EQUIPMENT_ID]);
    expect(first.hasMore).toBe(false);
    expect((await pull(owner, first.cursor)).changes.customers).toEqual([]);
    await push(owner, [{ type: "archive_customer", customerId: CUSTOMER_ID }]);
    const next = await pull(owner, first.cursor);
    expect(next.changes.customers[0]?.deletedAt).not.toBeNull();
    expect(next.changes.sites[0]?.deletedAt).not.toBeNull();
  });

  it("never pushes to nor pulls from another organization", async () => {
    expect(
      await push(otherOwner, [
        { type: "update_site", siteId: SITE_ID, changes: { city: "Pirate" } },
      ]),
    ).toEqual(["rejected:site_not_found"]);
    const other = await pull(otherOwner);
    expect(other.changes.customers).toEqual([]);
    expect(other.changes.sites).toEqual([]);
  });

  it("refuses a malformed cursor or push", async () => {
    expect((await platform.request("/api/sync/pull?cursor=nope", {}, owner)).status).toBe(400);
    const response = await platform.request(
      "/api/sync/push",
      json({ mutations: [{ id: mutationId(1), mutation: { type: "drop_table" } }] }),
      owner,
    );
    expect(response.status).toBe(400);
  });
});
