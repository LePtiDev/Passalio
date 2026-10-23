import { err, ok, type SyncPushResult } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer, updateCustomer } from "@/contexts/customers/customer-store";
import { addEquipment, addEquipmentPhoto } from "@/contexts/customers/equipment-store";
import type { ApiError } from "../api-client";
import type { LocalDatabase } from "../db/local-database";
import { createTestDatabase } from "../db/test-database";
import type { PulledChanges } from "./sync-api";
import { synchronize, type SyncApi } from "./sync-engine";
import { serverCustomerRecord } from "./sync-test-records";

const actor = { userId: "user-1", organizationId: "organization-a" };

const SERVER_FAILURES: readonly ApiError[] = [
  { code: "unauthenticated", traceId: "trace-401" },
  { code: "impersonation_read_only", traceId: "trace-403" },
  { code: "internal", traceId: "trace-500" },
  { code: "invalid_response", traceId: "trace-200" },
];

const emptyPull = (overrides: Partial<PulledChanges["changes"]> = {}): PulledChanges => ({
  changes: { customers: [], sites: [], equipments: [], photos: [], ...overrides },
  cursor: "cursor-1",
  hasMore: false,
});

const fakeApi = (overrides: Partial<SyncApi> = {}): SyncApi => ({
  push: vi.fn<SyncApi["push"]>(async (mutations) =>
    ok({
      results: mutations.map(({ id }): SyncPushResult => ({ id, status: "applied" })),
    }),
  ),
  pull: vi.fn<SyncApi["pull"]>(async () => ok(emptyPull())),
  upload: vi.fn<SyncApi["upload"]>(async () => ok(undefined)),
  ...overrides,
});

const createEquipmentWithPhoto = async (database: LocalDatabase) => {
  const { siteId } = await createCustomer(database, actor, {
    customer: { kind: "individual", lastName: "Photo" },
    site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
  });
  const equipmentId = await addEquipment(database, actor, {
    siteId: siteId ?? "",
    equipment: { kind: "boiler" },
  });
  await addEquipmentPhoto(database, actor, {
    equipmentId,
    kind: "plate",
    blob: new Blob(["photo"], { type: "image/jpeg" }),
  });
  return equipmentId;
};

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("push refused as a whole by the server", () => {
  it.each(SERVER_FAILURES)(
    "keeps every change waiting and records no rejection when the push fails with $code",
    async (failure) => {
      const { customerId } = await createCustomer(database, actor, {
        customer: { kind: "individual", lastName: "Hors-ligne" },
      });
      await updateCustomer(database, customerId, { notes: "Note" });
      const pull = vi.fn<SyncApi["pull"]>(async () => ok(emptyPull()));
      const result = await synchronize(
        database,
        fakeApi({ push: vi.fn<SyncApi["push"]>(async () => err(failure)), pull }),
      );
      expect(result).toEqual({ isOk: false, error: failure });
      expect(await database.outbox.count()).toBe(2);
      expect(await database.rejections.count()).toBe(0);
      expect((await database.customers.get(customerId))?.notes).toBe("Note");
      expect(await database.syncState.get("lastSyncedAt")).toBeUndefined();
      expect(pull).not.toHaveBeenCalled();
    },
  );

  it("pushes the kept changes again with the same ids once the server answers", async () => {
    await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Hors-ligne" },
    });
    const firstPush = vi.fn<SyncApi["push"]>(async () =>
      err({ code: "internal", traceId: "trace-500" }),
    );
    await synchronize(database, fakeApi({ push: firstPush }));
    const secondApi = fakeApi();
    expect((await synchronize(database, secondApi)).isOk).toBe(true);
    expect(vi.mocked(secondApi.push).mock.calls[0]?.[0].map(({ id }) => id)).toEqual(
      firstPush.mock.calls[0]?.[0].map(({ id }) => id),
    );
    expect(await database.outbox.count()).toBe(0);
  });
});

describe("photo upload failures", () => {
  it("keeps a photo waiting when the network drops during the upload, then sends it", async () => {
    await createEquipmentWithPhoto(database);
    await synchronize(
      database,
      fakeApi({
        upload: vi.fn<SyncApi["upload"]>(async () => err({ code: "network", traceId: null })),
      }),
    );
    expect(await database.pendingPhotos.count()).toBe(1);
    const upload = vi.fn<SyncApi["upload"]>(async () => ok(undefined));
    await synchronize(database, fakeApi({ upload }));
    expect(upload).toHaveBeenCalledOnce();
    expect(await database.pendingPhotos.count()).toBe(0);
    expect(await database.photos.count()).toBe(1);
  });

  it("drops a photo whose equipment creation was refused and records both refusals", async () => {
    await createEquipmentWithPhoto(database);
    await synchronize(
      database,
      fakeApi({
        push: vi.fn<SyncApi["push"]>(async (mutations) =>
          ok({
            results: mutations.map(({ id, mutation }): SyncPushResult =>
              mutation.type === "add_equipment"
                ? { id, status: "rejected", error: "equipment_kind_not_offered" }
                : { id, status: "applied" },
            ),
          }),
        ),
        upload: vi.fn<SyncApi["upload"]>(async () =>
          err({ code: "equipment_not_found", traceId: "trace-404" }),
        ),
      }),
    );
    expect(await database.pendingPhotos.count()).toBe(0);
    expect(await database.photos.count()).toBe(0);
    expect(await database.equipments.count()).toBe(0);
    expect(await database.rejections.count()).toBe(2);
  });
});

const pullDuringLocalEdit = (customerId: string, deletedAt: string | null) =>
  vi.fn<SyncApi["pull"]>(async () => {
    await updateCustomer(database, customerId, { lastName: "Local" });
    return ok(emptyPull({ customers: [serverCustomerRecord(customerId, "Serveur", deletedAt)] }));
  });

describe("pulled deletions and local changes", () => {
  it("does not overwrite a record changed on the phone while the pull was running", async () => {
    const { customerId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Avant" },
    });
    await synchronize(database, fakeApi({ pull: pullDuringLocalEdit(customerId, null) }));
    expect((await database.customers.get(customerId))?.lastName).toBe("Local");
    expect(await database.outbox.count()).toBe(1);
  });

  it("does not delete a record changed on the phone while the pull was running", async () => {
    const { customerId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Avant" },
    });
    await synchronize(
      database,
      fakeApi({ pull: pullDuringLocalEdit(customerId, "2026-10-22T11:00:00.000Z") }),
    );
    expect((await database.customers.get(customerId))?.lastName).toBe("Local");
  });

  it("keeps the last synchronization time unchanged when the pull fails", async () => {
    await database.syncState.put({ key: "lastSyncedAt", value: "2026-10-22T08:00:00.000Z" });
    const result = await synchronize(
      database,
      fakeApi({
        pull: vi.fn<SyncApi["pull"]>(async () => err({ code: "internal", traceId: "trace-500" })),
      }),
    );
    expect(result.isOk).toBe(false);
    expect((await database.syncState.get("lastSyncedAt"))?.value).toBe("2026-10-22T08:00:00.000Z");
  });
});
