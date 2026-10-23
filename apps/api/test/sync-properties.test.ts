import { SYNC_PUSH_MAX_MUTATIONS, type CustomerMutation } from "@passalio/shared";
import * as fc from "fast-check";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const SYNC_PAGE_SIZE = 200;
const PAGED_CUSTOMER_COUNT = SYNC_PAGE_SIZE * 2 + 50;

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

type PulledPage = z.infer<typeof pullResponse>;

const uuidOf = (prefix: number, index: number) =>
  `0190f3a0-0000-7000-8${String(prefix).padStart(3, "0")}-${String(index).padStart(12, "0")}`;

let platform: TestPlatform;
let batchOwner: string;
let pagingOwner: string;
let pagingOrganizationId: string;
let archiveOwner: string;
let mutationCounter = 0;

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
    json({ trades: ["chimney_sweeping"] }, "PATCH"),
    cookie,
  );
  return organization.id;
};

const envelopesOf = (mutations: readonly CustomerMutation[]) =>
  mutations.map((mutation) => ({ id: uuidOf(900, (mutationCounter += 1)), mutation }));

const pushEnvelopes = async (
  cookie: string,
  envelopes: readonly { readonly id: string; readonly mutation: CustomerMutation }[],
) => platform.request("/api/sync/push", json({ mutations: envelopes }), cookie);

const push = async (cookie: string, mutations: readonly CustomerMutation[]) =>
  pushResponse.parse(await (await pushEnvelopes(cookie, envelopesOf(mutations))).json()).results;

const pull = async (cookie: string, cursor?: string): Promise<PulledPage> => {
  const query = cursor === undefined ? "" : `?cursor=${cursor}`;
  return pullResponse.parse(
    await (await platform.request(`/api/sync/pull${query}`, {}, cookie)).json(),
  );
};

const pullAll = async (
  cookie: string,
  from?: string,
  pages: readonly PulledPage[] = [],
): Promise<{ readonly pages: readonly PulledPage[]; readonly cursor: string | undefined }> => {
  const page = await pull(cookie, from);
  const pulled = [...pages, page];
  return page.hasMore
    ? pullAll(cookie, page.cursor, pulled)
    : { pages: pulled, cursor: page.cursor };
};

const creationOf = (prefix: number, index: number): CustomerMutation => ({
  type: "create_customer",
  customerId: uuidOf(prefix, index),
  customer: { kind: "individual", lastName: `Client ${index}` },
});

const chunksOf = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

beforeAll(async () => {
  platform = await startTestPlatform();
  batchOwner = await platform.signIn("lot-sync@example.fr");
  await createOrganization(batchOwner, "Ramonage Lots");
  pagingOwner = await platform.signIn("pages-sync@example.fr");
  pagingOrganizationId = await createOrganization(pagingOwner, "Ramonage Pages");
  archiveOwner = await platform.signIn("archives-sync@example.fr");
  await createOrganization(archiveOwner, "Ramonage Archives");
  const creations = Array.from({ length: PAGED_CUSTOMER_COUNT }, (_, index) =>
    creationOf(2, index),
  );
  await chunksOf(creations, SYNC_PUSH_MAX_MUTATIONS).reduce<Promise<unknown>>(
    async (previous, chunk) => {
      await previous;
      return push(pagingOwner, chunk);
    },
    Promise.resolve(),
  );
}, 120_000);

afterAll(async () => {
  await platform.dispose();
});

describe("sync push batches", () => {
  it("applies a full batch of 50 mutations and creates nothing new when it is pushed again", async () => {
    const envelopes = envelopesOf(
      Array.from({ length: SYNC_PUSH_MAX_MUTATIONS }, (_, index) => creationOf(1, index)),
    );
    const first = pushResponse.parse(await (await pushEnvelopes(batchOwner, envelopes)).json());
    const second = pushResponse.parse(await (await pushEnvelopes(batchOwner, envelopes)).json());
    expect(first.results.map(({ id }) => id)).toEqual(envelopes.map(({ id }) => id));
    expect(first.results.every(({ status }) => status === "applied")).toBe(true);
    expect(second.results.every(({ status }) => status === "applied")).toBe(true);
    const pulled = (await pullAll(batchOwner)).pages.flatMap(({ changes }) => changes.customers);
    expect(pulled).toHaveLength(SYNC_PUSH_MAX_MUTATIONS);
    expect(new Set(pulled.map(({ id }) => id)).size).toBe(SYNC_PUSH_MAX_MUTATIONS);
  });

  it("refuses a batch of more than 50 mutations without applying any of them", async () => {
    const response = await pushEnvelopes(
      batchOwner,
      envelopesOf(
        Array.from({ length: SYNC_PUSH_MAX_MUTATIONS + 1 }, (_, index) => creationOf(3, index)),
      ),
    );
    expect(response.status).toBe(400);
    const pulled = (await pullAll(batchOwner)).pages.flatMap(({ changes }) => changes.customers);
    expect(pulled.some(({ id }) => id === uuidOf(3, 0))).toBe(false);
  });

  it("answers each mutation in the order it was sent", async () => {
    const results = await push(batchOwner, [
      {
        type: "add_site",
        siteId: uuidOf(4, 1),
        customerId: uuidOf(4, 0),
        site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
      },
      creationOf(4, 0),
      {
        type: "add_site",
        siteId: uuidOf(4, 1),
        customerId: uuidOf(4, 0),
        site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
      },
    ]);
    expect(results.map(({ status, error }) => error ?? status)).toEqual([
      "customer_not_found",
      "applied",
      "applied",
    ]);
  });
});

describe("sync pull cursor", () => {
  it("pages 200 rows at a time without skipping or repeating a row when updated_at ties", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 2 }), {
          minLength: PAGED_CUSTOMER_COUNT,
          maxLength: PAGED_CUSTOMER_COUNT,
        }),
        async (offsets) => {
          const database = platform.env.DB;
          const base = Date.parse("2026-10-22T10:00:00Z");
          await database.batch(
            offsets.map((offset, index) =>
              database
                .prepare("UPDATE customers SET updated_at = ? WHERE id = ? AND organization_id = ?")
                .bind(base + offset, uuidOf(2, index), pagingOrganizationId),
            ),
          );
          const { pages } = await pullAll(pagingOwner);
          const ids = pages.flatMap(({ changes }) => changes.customers.map(({ id }) => id));
          expect(pages.map(({ changes }) => changes.customers.length)).toEqual([
            SYNC_PAGE_SIZE,
            SYNC_PAGE_SIZE,
            PAGED_CUSTOMER_COUNT - SYNC_PAGE_SIZE * 2,
          ]);
          expect(new Set(ids).size).toBe(ids.length);
          expect(ids.toSorted()).toEqual(
            Array.from({ length: PAGED_CUSTOMER_COUNT }, (_, index) => uuidOf(2, index)).toSorted(),
          );
        },
      ),
      { numRuns: 3 },
    );
  }, 120_000);

  it("returns nothing more from the last cursor until a row changes", async () => {
    const { cursor } = await pullAll(pagingOwner);
    expect((await pull(pagingOwner, cursor)).changes.customers).toEqual([]);
    await push(pagingOwner, [
      { type: "update_customer", customerId: uuidOf(2, 7), changes: { lastName: "Modifié" } },
    ]);
    const next = await pull(pagingOwner, cursor);
    expect(next.changes.customers.map(({ id }) => id)).toEqual([uuidOf(2, 7)]);
    expect(next.changes.customers[0]?.lastName).toBe("Modifié");
  });
});

describe("sync pull deletions", () => {
  it("sends the archived customer with its sites, equipments and photos marked deleted", async () => {
    const customerId = uuidOf(5, 0);
    const siteId = uuidOf(5, 1);
    const equipmentId = uuidOf(5, 2);
    const photoId = uuidOf(5, 3);
    await push(archiveOwner, [
      creationOf(5, 0),
      {
        type: "add_site",
        siteId,
        customerId,
        site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
      },
      { type: "add_equipment", equipmentId, siteId, equipment: { kind: "insert" } },
    ]);
    const upload = await platform.request(
      `/api/equipments/${equipmentId}/photos?id=${photoId}&kind=plate`,
      {
        method: "POST",
        body: new Uint8Array([255, 216, 255, 224]),
        headers: { "content-type": "image/jpeg" },
      },
      archiveOwner,
    );
    expect(upload.status).toBe(201);
    const { cursor } = await pullAll(archiveOwner);
    await push(archiveOwner, [{ type: "archive_customer", customerId }]);
    const { pages } = await pullAll(archiveOwner, cursor);
    const deletedIn = (table: keyof PulledPage["changes"]) =>
      pages.flatMap(({ changes }) =>
        changes[table].flatMap(({ id, deletedAt }) => (deletedAt === null ? [] : [id])),
      );
    expect(deletedIn("customers")).toEqual([customerId]);
    expect(deletedIn("sites")).toEqual([siteId]);
    expect(deletedIn("equipments")).toEqual([equipmentId]);
    expect(deletedIn("photos")).toEqual([photoId]);
  });

  it("refuses a photo whose equipment is not on the server yet, then accepts it once pushed", async () => {
    const customerId = uuidOf(6, 0);
    const siteId = uuidOf(6, 1);
    const equipmentId = uuidOf(6, 2);
    const photoId = uuidOf(6, 3);
    const uploadPhoto = () =>
      platform.request(
        `/api/equipments/${equipmentId}/photos?id=${photoId}&kind=plate`,
        {
          method: "POST",
          body: new Uint8Array([255, 216, 255, 224]),
          headers: { "content-type": "image/jpeg" },
        },
        archiveOwner,
      );
    expect((await uploadPhoto()).status).toBe(404);
    await push(archiveOwner, [
      creationOf(6, 0),
      {
        type: "add_site",
        siteId,
        customerId,
        site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
      },
      { type: "add_equipment", equipmentId, siteId, equipment: { kind: "insert" } },
    ]);
    expect((await uploadPhoto()).status).toBe(201);
  });
});
