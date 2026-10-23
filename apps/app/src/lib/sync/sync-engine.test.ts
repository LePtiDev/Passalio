import { err, ok, type SyncPushResult } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer, updateCustomer } from "@/contexts/customers";
import { addEquipment, addEquipmentPhoto } from "@/contexts/customers/equipment-store";
import type { LocalDatabase } from "../db/local-database";
import { createTestDatabase } from "../db/test-database";
import type { CustomerRecord } from "../db/local-records";
import type { PulledChanges } from "./sync-api";
import { synchronize, type SyncApi } from "./sync-engine";

const actor = { userId: "user-1", organizationId: "organization-a" };
const NETWORK_ERROR = { code: "network", traceId: null };

const emptyChanges = (overrides: Partial<PulledChanges["changes"]> = {}): PulledChanges => ({
  changes: { customers: [], sites: [], equipments: [], photos: [], ...overrides },
  cursor: "cursor-1",
  hasMore: false,
});

const serverCustomer = (
  id: string,
  lastName: string,
  deletedAt: string | null = null,
): CustomerRecord => ({
  id,
  organizationId: actor.organizationId,
  createdAt: "2026-10-22T10:00:00.000Z",
  updatedAt: "2026-10-22T10:00:00.000Z",
  deletedAt,
  kind: "individual",
  civility: null,
  firstName: null,
  lastName,
  companyName: null,
  searchName: lastName.toLowerCase(),
  email: null,
  phone: null,
  secondaryPhone: null,
  billingAddress: null,
  billingPostalCode: null,
  billingCity: null,
  notes: null,
  remindersOptedOutAt: null,
  createdByUserId: "user-2",
});

const resultOf =
  (status: SyncPushResult["status"], error?: string) =>
  ({ id }: { readonly id: string }): SyncPushResult =>
    error === undefined ? { id, status } : { id, status, error };

const fakeApi = (overrides: Partial<SyncApi> = {}): SyncApi => ({
  push: vi.fn<SyncApi["push"]>(async (mutations) =>
    ok({ results: mutations.map(resultOf("applied")) }),
  ),
  pull: vi.fn<SyncApi["pull"]>(async () => ok(emptyChanges())),
  upload: vi.fn<SyncApi["upload"]>(async () => ok(undefined)),
  ...overrides,
});

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("synchronize", () => {
  it("pushes the outbox in order, then pulls and records the sync time", async () => {
    await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
    });
    const api = fakeApi();
    expect((await synchronize(database, api)).isOk).toBe(true);
    expect(api.push).toHaveBeenCalledOnce();
    expect(await database.outbox.count()).toBe(0);
    expect((await database.syncState.get("cursor"))?.value).toBe("cursor-1");
    expect(await database.syncState.get("lastSyncedAt")).toBeDefined();
  });

  it("keeps the outbox when the network fails", async () => {
    await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
    });
    const result = await synchronize(
      database,
      fakeApi({ push: vi.fn<SyncApi["push"]>(async () => err(NETWORK_ERROR)) }),
    );
    expect(result).toEqual({ isOk: false, error: NETWORK_ERROR });
    expect(await database.outbox.count()).toBe(1);
  });

  it("applies pulled changes and deletions", async () => {
    await database.customers.put(serverCustomer("customer-old", "Ancien"));
    const api = fakeApi({
      pull: vi.fn<SyncApi["pull"]>(async () =>
        ok(
          emptyChanges({
            customers: [
              serverCustomer("customer-new", "Nouveau"),
              serverCustomer("customer-old", "Ancien", "2026-10-22T11:00:00.000Z"),
            ],
          }),
        ),
      ),
    });
    await synchronize(database, api);
    expect((await database.customers.toArray()).map(({ id }) => id)).toEqual(["customer-new"]);
  });

  it("does not overwrite a record that still has a local change waiting", async () => {
    const { customerId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
    });
    await synchronize(database, fakeApi());
    await updateCustomer(database, customerId, { lastName: "Local" });
    const api = fakeApi({
      push: vi.fn<SyncApi["push"]>(async () => err(NETWORK_ERROR)),
    });
    await synchronize(database, api);
    await synchronize(
      database,
      fakeApi({
        push: vi.fn<SyncApi["push"]>(async () => err(NETWORK_ERROR)),
        pull: vi.fn<SyncApi["pull"]>(async () =>
          ok(emptyChanges({ customers: [serverCustomer(customerId, "Serveur")] })),
        ),
      }),
    );
    expect((await database.customers.get(customerId))?.lastName).toBe("Local");
  });

  it("removes a rejected creation, records it and restarts the pull from scratch", async () => {
    const { customerId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Refusé" },
    });
    await database.syncState.put({ key: "cursor", value: "old-cursor" });
    const pull = vi.fn<SyncApi["pull"]>(async () => ok(emptyChanges()));
    await synchronize(
      database,
      fakeApi({
        push: vi.fn<SyncApi["push"]>(async (mutations) =>
          ok({ results: mutations.map(resultOf("rejected", "forbidden")) }),
        ),
        pull,
      }),
    );
    expect(await database.customers.get(customerId)).toBeUndefined();
    expect((await database.rejections.toArray())[0]).toMatchObject({
      description: "create_customer",
      error: "forbidden",
    });
    expect(pull).toHaveBeenCalledWith(undefined);
  });

  it("uploads a photo once its equipment is on the server", async () => {
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
    const upload = vi.fn<SyncApi["upload"]>(async () => ok(undefined));
    await synchronize(database, fakeApi({ upload }));
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ equipmentId, kind: "plate" }));
    expect(await database.pendingPhotos.count()).toBe(0);
  });

  it("runs only one synchronization at a time", async () => {
    const api = fakeApi();
    await Promise.all([synchronize(database, api), synchronize(database, api)]);
    expect(api.pull).toHaveBeenCalledOnce();
  });
});
