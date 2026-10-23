import { err, ok, type SyncPushResult } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer } from "@/contexts/customers/customer-store";
import { addEquipment, addEquipmentPhoto } from "@/contexts/customers/equipment-store";
import type { ApiError } from "../api-client";
import type { LocalDatabase } from "../db/local-database";
import { createTestDatabase } from "../db/test-database";
import { synchronize, type SyncApi } from "./sync-engine";

const actor = { userId: "user-1", organizationId: "organization-a" };

const FAILURES_THAT_ARE_NOT_A_REFUSAL: readonly ApiError[] = [
  { code: "unauthenticated", traceId: "trace-401" },
  { code: "impersonation_read_only", traceId: "trace-403" },
  { code: "internal", traceId: "trace-500" },
];

const apiWithUpload = (upload: SyncApi["upload"]): SyncApi => ({
  push: vi.fn<SyncApi["push"]>(async (mutations) =>
    ok({
      results: mutations.map(({ id }): SyncPushResult => ({ id, status: "applied" })),
    }),
  ),
  pull: vi.fn<SyncApi["pull"]>(async () =>
    ok({
      changes: { customers: [], sites: [], equipments: [], photos: [] },
      cursor: "cursor-1",
      hasMore: false,
    }),
  ),
  upload,
});

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("photo upload that fails without being refused", () => {
  it.each(FAILURES_THAT_ARE_NOT_A_REFUSAL)(
    "keeps the photo taken offline waiting when the upload fails with $code",
    async (failure) => {
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
      await synchronize(
        database,
        apiWithUpload(vi.fn<SyncApi["upload"]>(async () => err(failure))),
      );
      expect((await database.pendingPhotos.toArray()).map((photo) => photo.equipmentId)).toEqual([
        equipmentId,
      ]);
      expect(await database.photos.count()).toBe(1);
      expect(await database.rejections.count()).toBe(0);
    },
  );
});
