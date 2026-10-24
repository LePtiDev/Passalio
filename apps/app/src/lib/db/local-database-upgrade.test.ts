import { Dexie } from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { serverInterventionRecord } from "@/lib/sync/planning-test-records";
import { LOCAL_DATABASE_PREFIX, LocalDatabase } from "./local-database";
import type { ServiceRecord } from "./local-records";

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

const VERSION_3_STORES = { ...VERSION_2_STORES, visitTypes: "type" };

const versionThreeIntervention = (id: string, technicianUserId: string) =>
  Object.fromEntries(
    Object.entries(serverInterventionRecord(id, { technicianUserId })).filter(
      ([key]) => key !== "technicianUserIds" && key !== "serviceLines",
    ),
  );

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

const openVersionThree = async () => {
  const legacy = new Dexie(`${LOCAL_DATABASE_PREFIX}${organizationId}`);
  legacy.version(3).stores(VERSION_3_STORES);
  await legacy.open();
  return legacy;
};

describe("LocalDatabase version 4", () => {
  it("makes the lead the only technician of the visits stored before the upgrade", async () => {
    const legacy = await openVersionThree();
    await legacy.table("interventions").put(versionThreeIntervention("visit-old", "user-lead"));
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const upgraded = await database.interventions.get("visit-old");
    database.close();

    expect(upgraded?.technicianUserId).toBe("user-lead");
    expect(upgraded?.technicianUserIds).toEqual(["user-lead"]);
  });

  it("gives an empty service line list to the visits stored before the upgrade", async () => {
    const legacy = await openVersionThree();
    await legacy.table("interventions").put({
      ...versionThreeIntervention("visit-typed", "user-lead"),
      visitTypes: ["chimney_sweeping"],
    });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const upgraded = await database.interventions.get("visit-typed");
    database.close();

    expect(upgraded?.serviceLines).toEqual([]);
    expect(upgraded?.visitTypes).toEqual(["chimney_sweeping"]);
    expect(upgraded?.durationMinutes).toBe(60);
  });

  it("keeps the technicians and service lines already stored", async () => {
    const serviceLines = [
      { serviceId: "service-1", name: "Ramonage", durationMinutes: 60, priceCents: 8000 },
    ];
    const legacy = await openVersionThree();
    await legacy.table("interventions").put({
      ...versionThreeIntervention("visit-shared", "user-lead"),
      technicianUserIds: ["user-lead", "user-second"],
      serviceLines,
    });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const upgraded = await database.interventions.get("visit-shared");
    database.close();

    expect(upgraded?.technicianUserIds).toEqual(["user-lead", "user-second"]);
    expect(upgraded?.serviceLines).toEqual(serviceLines);
  });

  it("upgrades a version 2 database in one go", async () => {
    const legacy = await openVersionTwo();
    const { visitTypes: _visitTypes, ...versionTwoRecord } = versionThreeIntervention(
      "visit-very-old",
      "user-lead",
    );
    await legacy.table("interventions").put(versionTwoRecord);
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const upgraded = await database.interventions.get("visit-very-old");
    database.close();

    expect(upgraded?.visitTypes).toEqual([]);
    expect(upgraded?.serviceLines).toEqual([]);
    expect(upgraded?.technicianUserIds).toEqual(["user-lead"]);
  });

  it("drops the visit type table", async () => {
    const legacy = await openVersionThree();
    await legacy.table("visitTypes").put({ type: "chimney_sweeping", minutes: 60 });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    await database.open();
    const tableNames = database.tables.map(({ name }) => name);
    database.close();

    expect(database.verno).toBe(4);
    expect(tableNames).not.toContain("visitTypes");
  });

  it("adds a service table keyed by identifier", async () => {
    const legacy = await openVersionThree();
    legacy.close();

    const service: ServiceRecord = {
      id: "service-1",
      name: "Ramonage",
      durationMinutes: 60,
      priceCents: 8000,
      document: "chimney_sweeping_certificate",
      trade: "chimney_sweeping",
    };
    const database = new LocalDatabase(organizationId);
    await database.services.put(service);
    await database.services.put({ ...service, priceCents: 9000 });
    const stored = await database.services.toArray();
    database.close();

    expect(stored).toEqual([{ ...service, priceCents: 9000 }]);
  });

  it("keeps the members of the version 3 database", async () => {
    const legacy = await openVersionThree();
    await legacy.table("members").put({ userId: "user-1", name: "Alice Durand", role: "owner" });
    legacy.close();

    const database = new LocalDatabase(organizationId);
    const member = await database.members.get("user-1");
    database.close();

    expect(member).toEqual({ userId: "user-1", name: "Alice Durand", role: "owner" });
  });
});
