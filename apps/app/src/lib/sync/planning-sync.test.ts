import { newId, ok, type SyncPushResult } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelIntervention, createIntervention } from "@/contexts/scheduling/intervention-store";
import type { LocalDatabase } from "../db/local-database";
import { enqueue } from "../db/outbox";
import { applyPulledChanges } from "./apply-pulled-changes";
import { createTestDatabase } from "../db/test-database";
import { serverDocumentRecord, serverInterventionRecord } from "./planning-test-records";
import type { PulledChanges } from "./sync-api";
import { synchronize, type SyncApi } from "./sync-engine";

const actor = { userId: "user-1", organizationId: "organization-a" };
const DELETED_AT = "2026-10-22T11:00:00.000Z";

const fields = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  technicianUserId: "user-1",
  scheduledDate: "2026-10-23",
  startTime: "09:00",
  durationMinutes: 60,
  equipmentIds: [],
};

const pulled = (overrides: Partial<PulledChanges["changes"]> = {}): PulledChanges => ({
  changes: { customers: [], sites: [], equipments: [], photos: [], ...overrides },
  cursor: "cursor-1",
  hasMore: false,
});

const fakeApi = (changes: PulledChanges = pulled(), rejectedType?: string): SyncApi => ({
  push: vi.fn<SyncApi["push"]>(async (mutations) =>
    ok({
      results: mutations.map(({ id, mutation }): SyncPushResult =>
        mutation.type === rejectedType
          ? { id, status: "rejected", error: "forbidden" }
          : { id, status: "applied" },
      ),
    }),
  ),
  pull: vi.fn<SyncApi["pull"]>(async () => ok(changes)),
  upload: vi.fn<SyncApi["upload"]>(async () => ok(undefined)),
});

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("pulling visits and documents", () => {
  it("stores the visits and documents sent by the server", async () => {
    await synchronize(
      database,
      fakeApi(
        pulled({
          interventions: [serverInterventionRecord("visit-1")],
          documents: [serverDocumentRecord("document-1", "visit-1", "equipment-1")],
        }),
      ),
    );
    expect((await database.interventions.get("visit-1"))?.status).toBe("planned");
    expect((await database.documents.get("document-1"))?.interventionId).toBe("visit-1");
  });

  it("removes the visits and documents deleted on the server", async () => {
    await database.interventions.put(serverInterventionRecord("visit-1"));
    await database.documents.put(serverDocumentRecord("document-1", "visit-1", "equipment-1"));
    await synchronize(
      database,
      fakeApi(
        pulled({
          interventions: [serverInterventionRecord("visit-1", { deletedAt: DELETED_AT })],
          documents: [serverDocumentRecord("document-1", "visit-1", "equipment-1", DELETED_AT)],
        }),
      ),
    );
    expect(await database.interventions.count()).toBe(0);
    expect(await database.documents.count()).toBe(0);
  });

  it("updates a visit changed on the server", async () => {
    await database.interventions.put(serverInterventionRecord("visit-1"));
    await synchronize(
      database,
      fakeApi(
        pulled({ interventions: [serverInterventionRecord("visit-1", { startTime: "14:00" })] }),
      ),
    );
    expect((await database.interventions.get("visit-1"))?.startTime).toBe("14:00");
  });

  it("accepts a server that does not send visits nor documents yet", async () => {
    await database.interventions.put(serverInterventionRecord("visit-1"));
    const result = await synchronize(database, fakeApi(pulled()));
    expect(result.isOk).toBe(true);
    expect(await database.interventions.count()).toBe(1);
  });

  it("does not overwrite a visit cancelled offline that is still waiting to be sent", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    await cancelIntervention(database, interventionId);
    await applyPulledChanges(
      database,
      pulled({ interventions: [serverInterventionRecord(interventionId, { status: "planned" })] }),
    );
    expect((await database.interventions.get(interventionId))?.status).toBe("cancelled");
  });
});

describe("pushing visits", () => {
  it("sends the new visit then the cancellation, in order", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    await cancelIntervention(database, interventionId);
    const api = fakeApi();
    await synchronize(database, api);
    expect(vi.mocked(api.push).mock.calls[0]?.[0].map(({ mutation }) => mutation.type)).toEqual([
      "create_intervention",
      "cancel_intervention",
    ]);
    expect(await database.outbox.count()).toBe(0);
  });

  it("removes a visit whose creation the server refused, and records the refusal", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    await synchronize(database, fakeApi(pulled(), "create_intervention"));
    expect(await database.interventions.get(interventionId)).toBeUndefined();
    expect(
      (await database.rejections.toArray()).map(({ description, error }) => ({
        description,
        error,
      })),
    ).toEqual([{ description: "create_intervention", error: "forbidden" }]);
    expect(await database.outbox.count()).toBe(0);
  });

  it("keeps the visit when only its cancellation is refused", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    await cancelIntervention(database, interventionId);
    await synchronize(database, fakeApi(pulled(), "cancel_intervention"));
    expect(await database.interventions.get(interventionId)).toBeDefined();
    expect((await database.rejections.toArray())[0]?.description).toBe("cancel_intervention");
  });

  it("removes a signed document the server refused, and keeps the visit", async () => {
    const interventionId = newId();
    const equipmentId = newId();
    const documentId = newId();
    await database.interventions.put(
      serverInterventionRecord(interventionId, { equipmentIds: [equipmentId] }),
    );
    await database.documents.put(serverDocumentRecord(documentId, interventionId, equipmentId));
    await enqueue(database, {
      type: "sign_document",
      documentId,
      interventionId,
      equipmentId,
      deviceId: newId(),
      kind: "chimney_sweeping_certificate",
      templateVersion: 1,
      number: 1,
      signedAt: "2026-10-23T10:00:00.000Z",
      data: {},
    });
    await synchronize(database, fakeApi(pulled(), "sign_document"));
    expect(await database.documents.get(documentId)).toBeUndefined();
    expect(await database.interventions.get(interventionId)).toBeDefined();
    expect((await database.rejections.toArray())[0]?.description).toBe("sign_document");
  });

  it("restarts the pull from scratch after a refused visit", async () => {
    await createIntervention(database, actor, fields);
    await database.syncState.put({ key: "cursor", value: "old-cursor" });
    const api = fakeApi(pulled(), "create_intervention");
    await synchronize(database, api);
    expect(api.pull).toHaveBeenCalledWith(undefined);
  });
});
