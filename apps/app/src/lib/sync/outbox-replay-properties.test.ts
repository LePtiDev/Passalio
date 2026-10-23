import { err, ok, SYNC_PUSH_MAX_MUTATIONS, type SyncPushResult } from "@passalio/shared";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer, updateCustomer } from "@/contexts/customers/customer-store";
import { addEquipment, addEquipmentPhoto } from "@/contexts/customers/equipment-store";
import type { LocalDatabase } from "../db/local-database";
import { createTestDatabase } from "../db/test-database";
import type { PulledChanges } from "./sync-api";
import { synchronize, type SyncApi } from "./sync-engine";

const actor = { userId: "user-1", organizationId: "organization-a" };
const NETWORK_ERROR = { code: "network", traceId: null };

type PushOutcome = "answered" | "unreachable" | "answer_lost";

type PushedEnvelope = Parameters<SyncApi["push"]>[0][number];

const emptyPull = (): PulledChanges => ({
  changes: { customers: [], sites: [], equipments: [], photos: [] },
  cursor: "cursor-1",
  hasMore: false,
});

const fakeServer = (outcomes: readonly PushOutcome[] = []) => {
  const applied: string[] = [];
  const calls: (readonly string[])[] = [];
  const push = vi.fn<SyncApi["push"]>(async (mutations) => {
    const outcome = outcomes[calls.length] ?? "answered";
    calls.push(mutations.map(({ id }) => id));
    if (outcome === "unreachable") {
      return err(NETWORK_ERROR);
    }
    mutations.forEach(({ id }) => {
      if (!applied.includes(id)) {
        applied.push(id);
      }
    });
    return outcome === "answer_lost"
      ? err(NETWORK_ERROR)
      : ok({ results: mutations.map(({ id }): SyncPushResult => ({ id, status: "applied" })) });
  });
  const api: SyncApi = {
    push,
    pull: vi.fn<SyncApi["pull"]>(async () => ok(emptyPull())),
    upload: vi.fn<SyncApi["upload"]>(async () => ok(undefined)),
  };
  return { api, applied, calls };
};

const enqueuedIds = async (database: LocalDatabase) =>
  (await database.outbox.orderBy("seq").toArray()).map(({ id }) => id);

const makeLocalChange = async (
  database: LocalDatabase,
  index: number,
  lastCreated: string | undefined,
): Promise<string> => {
  if (index % 3 === 2 && lastCreated !== undefined) {
    await updateCustomer(database, lastCreated, { notes: `Note ${index}` });
    return lastCreated;
  }
  const { customerId } = await createCustomer(database, actor, {
    customer: { kind: "individual", lastName: `Client ${index}` },
  });
  return customerId;
};

const makeLocalChanges = async (database: LocalDatabase, count: number) => {
  await Array.from({ length: count }, (_, index) => index).reduce<Promise<string | undefined>>(
    async (previous, index) => makeLocalChange(database, index, await previous),
    Promise.resolve(undefined),
  );
};

const syncUntilEmpty = async (
  database: LocalDatabase,
  api: SyncApi,
  attemptsLeft: number,
): Promise<void> => {
  if (attemptsLeft === 0 || (await database.outbox.count()) === 0) {
    return;
  }
  await synchronize(database, api);
  await syncUntilEmpty(database, api, attemptsLeft - 1);
};

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("outbox push batches", () => {
  it("pushes the outbox in batches of at most 50, in order", async () => {
    await makeLocalChanges(database, SYNC_PUSH_MAX_MUTATIONS * 2 + 20);
    const expected = await enqueuedIds(database);
    const { api, calls } = fakeServer();
    expect((await synchronize(database, api)).isOk).toBe(true);
    expect(calls.map((ids) => ids.length)).toEqual([
      SYNC_PUSH_MAX_MUTATIONS,
      SYNC_PUSH_MAX_MUTATIONS,
      20,
    ]);
    expect(calls.flat()).toEqual(expected);
    expect(await database.outbox.count()).toBe(0);
  });

  it("pushes the same batch again, with the same identifiers, when the answer was lost", async () => {
    await makeLocalChanges(database, 5);
    const expected = await enqueuedIds(database);
    const { api, calls, applied } = fakeServer(["answer_lost"]);
    expect((await synchronize(database, api)).isOk).toBe(false);
    expect(await enqueuedIds(database)).toEqual(expected);
    expect((await synchronize(database, api)).isOk).toBe(true);
    expect(calls).toEqual([expected, expected]);
    expect(applied).toEqual(expected);
  });
});

describe("outbox replay properties", () => {
  it("delivers every change once, in the order it was made, whatever the network does", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: SYNC_PUSH_MAX_MUTATIONS * 2 + 10 }),
        fc.array(fc.constantFrom<PushOutcome>("answered", "unreachable", "answer_lost"), {
          maxLength: 12,
        }),
        async (count, outcomes) => {
          const local = createTestDatabase();
          try {
            await makeLocalChanges(local, count);
            const expected = await enqueuedIds(local);
            const { api, applied, calls } = fakeServer(outcomes);
            await syncUntilEmpty(local, api, outcomes.length + 5);
            expect(await local.outbox.count()).toBe(0);
            expect(await local.rejections.count()).toBe(0);
            expect(applied).toEqual(expected);
            expect(calls.every((ids) => ids.length <= SYNC_PUSH_MAX_MUTATIONS)).toBe(true);
            expect(
              calls.every((ids) => {
                const start = expected.indexOf(ids[0] ?? "");
                return ids.every((id, offset) => expected[start + offset] === id);
              }),
            ).toBe(true);
          } finally {
            await local.delete();
          }
        },
      ),
      { numRuns: 30 },
    );
  }, 60_000);
});

describe("rejected mutations", () => {
  it("records each rejection, drops it from the outbox and keeps pushing the next changes", async () => {
    const { customerId: refusedId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Refusé" },
    });
    const { customerId: acceptedId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Accepté" },
    });
    await updateCustomer(database, acceptedId, { phone: "0600000000" });
    const refusedEntry = (await database.outbox.orderBy("seq").toArray())[0];
    const push = vi.fn<SyncApi["push"]>(async (mutations: readonly PushedEnvelope[]) =>
      ok({
        results: mutations.map(({ id }): SyncPushResult =>
          id === refusedEntry?.id
            ? { id, status: "rejected", error: "forbidden" }
            : { id, status: "applied" },
        ),
      }),
    );
    const { api } = fakeServer();
    await synchronize(database, { ...api, push });
    expect(await database.outbox.count()).toBe(0);
    expect(await database.rejections.toArray()).toEqual([
      expect.objectContaining({
        id: refusedEntry?.id,
        description: "create_customer",
        error: "forbidden",
      }),
    ]);
    expect(await database.customers.get(refusedId)).toBeUndefined();
    expect(await database.customers.get(acceptedId)).toBeDefined();
  });

  it("removes a refused site or equipment creation from the phone", async () => {
    const { siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
      site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
    });
    const equipmentId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      equipment: { kind: "air_conditioner" },
    });
    const push = vi.fn<SyncApi["push"]>(async (mutations) =>
      ok({
        results: mutations.map(({ id, mutation }): SyncPushResult =>
          mutation.type === "add_site" || mutation.type === "add_equipment"
            ? { id, status: "rejected", error: "equipment_kind_not_offered" }
            : { id, status: "applied" },
        ),
      }),
    );
    const { api } = fakeServer();
    await synchronize(database, { ...api, push });
    expect(await database.sites.get(siteId ?? "")).toBeUndefined();
    expect(await database.equipments.get(equipmentId)).toBeUndefined();
    expect(await database.rejections.count()).toBe(2);
  });
});

describe("photo uploads", () => {
  it("does not upload a photo while its equipment creation is still waiting to be pushed", async () => {
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
    const { api } = fakeServer(["unreachable"]);
    await synchronize(database, api);
    expect(api.upload).not.toHaveBeenCalled();
    expect(await database.pendingPhotos.count()).toBe(1);
    await synchronize(database, api);
    expect(api.upload).toHaveBeenCalledOnce();
    expect(await database.pendingPhotos.count()).toBe(0);
  });

  it("uploads a photo only after the push that created its equipment was answered", async () => {
    const { siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Ordre" },
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
    const events: string[] = [];
    const { api } = fakeServer();
    await synchronize(database, {
      ...api,
      push: async (mutations) => {
        events.push(...mutations.map(({ mutation }) => mutation.type));
        return api.push(mutations);
      },
      upload: async (photo) => {
        events.push(`upload:${photo.equipmentId}`);
        return api.upload(photo);
      },
    });
    expect(events).toEqual([
      "create_customer",
      "add_site",
      "add_equipment",
      `upload:${equipmentId}`,
    ]);
  });
});
