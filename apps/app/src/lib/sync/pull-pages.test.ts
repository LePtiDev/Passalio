import { ok } from "@passalio/shared";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "../db/local-database";
import type { CustomerRecord } from "../db/local-records";
import { createTestDatabase } from "../db/test-database";
import type { PulledChanges } from "./sync-api";
import { synchronize, type SyncApi } from "./sync-engine";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverPhotoRecord,
  serverSiteRecord,
} from "./sync-test-records";

const pageOf = (
  changes: Partial<PulledChanges["changes"]>,
  cursor: string,
  hasMore: boolean,
): PulledChanges => ({
  changes: { customers: [], sites: [], equipments: [], photos: [], ...changes },
  cursor,
  hasMore,
});

const pagedApi = (pages: readonly PulledChanges[]) => {
  const pull = vi.fn<SyncApi["pull"]>(async (cursor) => {
    const index = cursor === undefined ? 0 : Number(cursor.replace("cursor-", ""));
    return ok(pages[index] ?? pageOf({}, cursor ?? "cursor-0", false));
  });
  const api: SyncApi = {
    push: vi.fn<SyncApi["push"]>(async () => ok({ results: [] })),
    pull,
    upload: vi.fn<SyncApi["upload"]>(async () => ok(undefined)),
  };
  return { api, pull };
};

type CustomerVersion = {
  readonly id: string;
  readonly lastName: string;
  readonly isDeleted: boolean;
};

const versionsBeforeDeletion = (versions: readonly CustomerVersion[]) => {
  const deleted = new Set<string>();
  return versions.filter(({ id, isDeleted }) => {
    if (deleted.has(id)) {
      return false;
    }
    if (isDeleted) {
      deleted.add(id);
    }
    return true;
  });
};

const latestPerId = (rows: readonly CustomerRecord[]) => [
  ...new Map(rows.map((row) => [row.id, row])).values(),
];

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("pull pages", () => {
  it("follows the cursor of each page until the server has nothing more", async () => {
    const { api, pull } = pagedApi([
      pageOf({ customers: [serverCustomerRecord("customer-1", "Un")] }, "cursor-1", true),
      pageOf({ customers: [serverCustomerRecord("customer-2", "Deux")] }, "cursor-2", true),
      pageOf({ customers: [serverCustomerRecord("customer-3", "Trois")] }, "cursor-3", false),
    ]);
    expect((await synchronize(database, api)).isOk).toBe(true);
    expect(pull.mock.calls.map(([cursor]) => cursor)).toEqual([undefined, "cursor-1", "cursor-2"]);
    expect((await database.customers.toArray()).map(({ id }) => id).toSorted()).toEqual([
      "customer-1",
      "customer-2",
      "customer-3",
    ]);
    expect((await database.syncState.get("cursor"))?.value).toBe("cursor-3");
  });

  it("starts the next synchronization from the last cursor it received", async () => {
    await database.syncState.put({ key: "cursor", value: "cursor-2" });
    const { api, pull } = pagedApi([]);
    await synchronize(database, api);
    expect(pull).toHaveBeenCalledWith("cursor-2");
  });

  it("removes deleted customers, sites, equipments and photos from the phone", async () => {
    await database.customers.put(serverCustomerRecord("customer-1", "Un"));
    await database.sites.put(serverSiteRecord("site-1", "customer-1"));
    await database.equipments.put(serverEquipmentRecord("equipment-1", "site-1"));
    await database.photos.put(serverPhotoRecord("photo-1", "equipment-1"));
    const deletedAt = "2026-10-22T11:00:00.000Z";
    const { api } = pagedApi([
      pageOf(
        {
          customers: [serverCustomerRecord("customer-1", "Un", deletedAt)],
          sites: [serverSiteRecord("site-1", "customer-1", deletedAt)],
          equipments: [serverEquipmentRecord("equipment-1", "site-1", deletedAt)],
          photos: [serverPhotoRecord("photo-1", "equipment-1", deletedAt)],
        },
        "cursor-1",
        false,
      ),
    ]);
    await synchronize(database, api);
    expect(await database.customers.count()).toBe(0);
    expect(await database.sites.count()).toBe(0);
    expect(await database.equipments.count()).toBe(0);
    expect(await database.photos.count()).toBe(0);
  });

  it("keeps the latest version of each row whatever way the server splits the pages", async () => {
    const version = fc.record({
      id: fc.constantFrom("customer-1", "customer-2", "customer-3", "customer-4"),
      lastName: fc.constantFrom("Martin", "Bernard", "Dubois"),
      isDeleted: fc.boolean(),
    });
    await fc.assert(
      fc.asyncProperty(
        fc.array(version, { maxLength: 30 }),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 30 }),
        async (versions, pageSizes) => {
          const rows = versionsBeforeDeletion(versions).map(({ id, lastName, isDeleted }) =>
            serverCustomerRecord(id, lastName, isDeleted ? "2026-10-22T11:00:00.000Z" : null),
          );
          const pages: PulledChanges[] = [];
          let start = 0;
          for (const size of pageSizes) {
            if (start < rows.length) {
              pages.push(
                pageOf(
                  { customers: latestPerId(rows.slice(start, start + size)) },
                  `cursor-${pages.length + 1}`,
                  true,
                ),
              );
              start += size;
            }
          }
          pages.push(
            pageOf(
              { customers: latestPerId(rows.slice(start)) },
              `cursor-${pages.length + 1}`,
              false,
            ),
          );
          const local = createTestDatabase();
          try {
            await synchronize(local, pagedApi(pages).api);
            const latest = new Map(rows.map((row) => [row.id, row]));
            const expected = [...latest.values()]
              .filter(({ deletedAt }) => deletedAt === null)
              .map(({ id, lastName }) => ({ id, lastName }))
              .toSorted((left, right) => left.id.localeCompare(right.id));
            const stored = (await local.customers.toArray())
              .map(({ id, lastName }) => ({ id, lastName }))
              .toSorted((left, right) => left.id.localeCompare(right.id));
            expect(stored).toEqual(expected);
          } finally {
            await local.delete();
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
