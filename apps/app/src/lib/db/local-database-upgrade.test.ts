import { Dexie } from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { serverInterventionRecord } from "@/lib/sync/planning-test-records";
import { LOCAL_DATABASE_PREFIX, LocalDatabase } from "./local-database";

const VERSION_2_STORES = {
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
};

const versionTwoIntervention = (id: string) =>
  Object.fromEntries(
    Object.entries(serverInterventionRecord(id)).filter(([key]) => key !== "visitTypes"),
  );

let organizationId: string;

beforeEach(() => {
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  organizationId = `upgrade-${crypto.randomUUID()}`;
});

afterEach(async () => {
  await Dexie.delete(`${LOCAL_DATABASE_PREFIX}${organizationId}`);
});

const openVersionTwo = async () => {
  const legacy = new Dexie(`${LOCAL_DATABASE_PREFIX}${organizationId}`);
  legacy.version(2).stores(VERSION_2_STORES);
  await legacy.open();
  return legacy;
};

describe("LocalDatabase version 3", () => {
  it("gives an empty visit type list to the visits stored before the upgrade", async () => {
    const legacy = await openVersionTwo();
    await legacy.table("interventions").put(versionTwoIntervention("visit-old"));
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const upgraded = await database.interventions.get("visit-old");
    database.close();

    expect(upgraded?.visitTypes).toEqual([]);
    expect(upgraded?.id).toBe("visit-old");
    expect(upgraded?.durationMinutes).toBe(60);
  });

  it("keeps the visit types already stored", async () => {
    const legacy = await openVersionTwo();
    await legacy
      .table("interventions")
      .put({ ...versionTwoIntervention("visit-typed"), visitTypes: ["chimney_sweeping"] });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const upgraded = await database.interventions.get("visit-typed");
    database.close();

    expect(upgraded?.visitTypes).toEqual(["chimney_sweeping"]);
  });

  it("adds a visit type table keyed by type", async () => {
    const legacy = await openVersionTwo();
    legacy.close();

    const database = new LocalDatabase(organizationId);
    await database.visitTypes.put({ type: "chimney_sweeping", minutes: 60 });
    await database.visitTypes.put({ type: "chimney_sweeping", minutes: 90 });
    const stored = await database.visitTypes.toArray();
    database.close();

    expect(database.verno).toBe(3);
    expect(stored).toEqual([{ type: "chimney_sweeping", minutes: 90 }]);
  });

  it("keeps the other data of the version 2 database", async () => {
    const legacy = await openVersionTwo();
    await legacy.table("members").put({ userId: "user-1", name: "Alice Durand", role: "owner" });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const member = await database.members.get("user-1");
    database.close();

    expect(member).toEqual({ userId: "user-1", name: "Alice Durand", role: "owner" });
  });
});
