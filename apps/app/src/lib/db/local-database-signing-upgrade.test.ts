import { Dexie } from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LOCAL_DATABASE_PREFIX, LocalDatabase } from "./local-database";

const VERSION_4_STORES = {
  customers: "id, searchName",
  sites: "id, customerId",
  equipments: "id, siteId",
  photos: "id, equipmentId",
  outbox: "++seq, *entityIds",
  pendingPhotos: "id, equipmentId",
  rejections: "id",
  syncState: "key",
  interventions: "id, scheduledDate, siteId",
  documents: "id, interventionId, equipmentId",
  members: "userId",
  services: "id",
};

let organizationId: string;

beforeEach(() => {
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  organizationId = `signing-upgrade-${crypto.randomUUID()}`;
});

afterEach(async () => {
  await Dexie.delete(`${LOCAL_DATABASE_PREFIX}${organizationId}`);
});

describe("LocalDatabase version 5", () => {
  it("keeps the version 4 data and opens empty number blocks and settings", async () => {
    const legacy = new Dexie(`${LOCAL_DATABASE_PREFIX}${organizationId}`);
    legacy.version(4).stores(VERSION_4_STORES);
    await legacy.open();
    await legacy.table("syncState").put({ key: "cursor", value: "cursor-1" });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const cursor = await database.syncState.get("cursor");
    const blocks = await database.numberBlocks.count();
    const settings = await database.localSettings.count();
    database.close();

    expect(cursor).toEqual({ key: "cursor", value: "cursor-1" });
    expect(blocks).toBe(0);
    expect(settings).toBe(0);
  });

  it("finds the number blocks of one user", async () => {
    const database = new LocalDatabase(organizationId);
    const block = {
      id: "block-1",
      userId: "user-1",
      deviceId: "device-1",
      numberPrefix: "RD-",
      firstNumber: 1,
      lastNumber: 20,
    };
    await database.numberBlocks.bulkPut([block, { ...block, id: "block-2", userId: "user-2" }]);
    const mine = await database.numberBlocks.where("userId").equals("user-1").toArray();
    database.close();

    expect(mine).toEqual([block]);
  });
});
