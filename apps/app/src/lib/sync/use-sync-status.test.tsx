import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { ok, type SyncPushResult } from "@passalio/shared";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer, updateCustomer } from "@/contexts/customers/customer-store";
import { addEquipment, addEquipmentPhoto } from "@/contexts/customers/equipment-store";
import type { LocalDatabase } from "../db/local-database";
import { createTestDatabase } from "../db/test-database";
import { synchronize, type SyncApi } from "./sync-engine";
import { useSyncStatus } from "./use-sync-status";

const actor = { userId: "user-1", organizationId: "organization-a" };

type SyncStatusView = ReturnType<typeof useSyncStatus>;

let latest: SyncStatusView | undefined;

const StatusProbe = ({
  database,
  onStatus,
}: {
  readonly database: LocalDatabase;
  readonly onStatus: (status: SyncStatusView) => void;
}) => {
  onStatus(useSyncStatus(database));
  return null;
};

const rememberStatus = (status: SyncStatusView) => {
  latest = status;
};

const fakeApi = (rejectedType?: string): SyncApi => ({
  push: vi.fn<SyncApi["push"]>(async (mutations) =>
    ok({
      results: mutations.map(({ id, mutation }): SyncPushResult =>
        mutation.type === rejectedType
          ? { id, status: "rejected", error: "forbidden" }
          : { id, status: "applied" },
      ),
    }),
  ),
  pull: vi.fn<SyncApi["pull"]>(async () =>
    ok({
      changes: { customers: [], sites: [], equipments: [], photos: [] },
      cursor: "cursor-1",
      hasMore: false,
    }),
  ),
  upload: vi.fn<SyncApi["upload"]>(async () => ok(undefined)),
});

const statusOf = (): SyncStatusView => {
  if (latest === undefined) {
    throw new Error("status not rendered");
  }
  return latest;
};

let database: LocalDatabase;
let root: Root;

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(async () => {
  latest = undefined;
  database = createTestDatabase();
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(<StatusProbe database={database} onStatus={rememberStatus} />);
  });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  await database.delete();
});

describe("useSyncStatus", () => {
  it("counts the changes and photos still waiting to be sent", async () => {
    await vi.waitFor(() => expect(statusOf().isLoaded).toBe(true));
    expect(statusOf().pendingCount).toBe(0);
    const { customerId, siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
      site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
    });
    await updateCustomer(database, customerId, { phone: "0600000000" });
    const equipmentId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      equipment: { kind: "boiler" },
    });
    await addEquipmentPhoto(database, actor, {
      equipmentId,
      kind: "plate",
      blob: new Blob(["photo"], { type: "image/jpeg" }),
    });
    await vi.waitFor(() => expect(statusOf().pendingCount).toBe(5));
    expect(statusOf().rejectedCount).toBe(0);
  });

  it("shows rejected changes and the last sync time once the outbox is sent", async () => {
    await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Refusé" },
    });
    await vi.waitFor(() => expect(statusOf().pendingCount).toBe(1));
    expect(statusOf().lastSyncedAt).toBeNull();
    await act(async () => {
      await synchronize(database, fakeApi("create_customer"));
    });
    await vi.waitFor(() =>
      expect(statusOf()).toMatchObject({
        rejectedCount: 1,
        pendingCount: 0,
        lastSyncedAt: expect.any(String),
      }),
    );
  });
});
