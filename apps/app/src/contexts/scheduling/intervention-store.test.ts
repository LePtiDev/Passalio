import { syncMutation, type InterventionFields } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { pendingEntityIds } from "@/lib/db/outbox";
import { createTestDatabase } from "@/lib/db/test-database";
import { cancelIntervention, createIntervention, localIntervention } from "./intervention-store";

const actor = { userId: "user-1", organizationId: "organization-a" };

const fields: InterventionFields = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  technicianUserId: "user-2",
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  durationMinutes: 60,
  equipmentIds: ["6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a03"],
  announcedPriceCents: 7550,
  notes: "Code portail 1234",
};

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("createIntervention", () => {
  it("writes the planned visit in the local database", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    expect(await database.interventions.get(interventionId)).toMatchObject({
      id: interventionId,
      organizationId: "organization-a",
      deletedAt: null,
      customerId: fields.customerId,
      siteId: fields.siteId,
      technicianUserId: "user-2",
      scheduledDate: "2026-10-23",
      startTime: "09:30",
      durationMinutes: 60,
      equipmentIds: fields.equipmentIds,
      announcedPriceCents: 7550,
      notes: "Code portail 1234",
      status: "planned",
      completedOn: null,
      paymentMethod: null,
      paidAmountCents: null,
      createdByUserId: "user-1",
    });
  });

  it("adds a create_intervention entry to the outbox", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    const outbox = await database.outbox.toArray();
    expect(outbox.map(({ mutation }) => mutation)).toEqual([
      { type: "create_intervention", interventionId, intervention: fields },
    ]);
    expect(await pendingEntityIds(database)).toContain(interventionId);
  });

  it("queues a mutation the server accepts", async () => {
    await createIntervention(database, actor, fields);
    const [entry] = await database.outbox.toArray();
    expect(syncMutation.safeParse(entry?.mutation).success).toBe(true);
  });

  it("gives each visit its own id", async () => {
    const first = await createIntervention(database, actor, fields);
    const second = await createIntervention(database, actor, fields);
    expect(first).not.toBe(second);
    expect(await database.interventions.count()).toBe(2);
    expect(await database.outbox.count()).toBe(2);
  });

  it("stores missing optional fields as null", async () => {
    const interventionId = await createIntervention(database, actor, {
      ...fields,
      startTime: undefined,
      announcedPriceCents: undefined,
      notes: undefined,
    });
    expect(await database.interventions.get(interventionId)).toMatchObject({
      startTime: null,
      announcedPriceCents: null,
      notes: null,
    });
  });

  it("finds the visit by its scheduled day", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    await createIntervention(database, actor, { ...fields, scheduledDate: "2026-10-30" });
    const onDay = await database.interventions
      .where("scheduledDate")
      .between("2026-10-19", "2026-10-25", true, true)
      .toArray();
    expect(onDay.map(({ id }) => id)).toEqual([interventionId]);
  });
});

describe("cancelIntervention", () => {
  it("marks the visit as cancelled and adds a cancel_intervention entry", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    const before = await database.interventions.get(interventionId);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await cancelIntervention(database, interventionId);
    const after = await database.interventions.get(interventionId);
    expect(after?.status).toBe("cancelled");
    expect(after?.updatedAt).not.toBe(before?.updatedAt);
    const outbox = await database.outbox.orderBy("seq").toArray();
    expect(outbox.map(({ mutation }) => mutation.type)).toEqual([
      "create_intervention",
      "cancel_intervention",
    ]);
    expect(outbox[1]?.mutation).toEqual({ type: "cancel_intervention", interventionId });
  });

  it("keeps the other visits untouched", async () => {
    const cancelled = await createIntervention(database, actor, fields);
    const kept = await createIntervention(database, actor, fields);
    await cancelIntervention(database, cancelled);
    expect((await database.interventions.get(kept))?.status).toBe("planned");
  });
});

describe("localIntervention", () => {
  it("builds the record with the given id, author and time", () => {
    expect(
      localIntervention(fields, { ...actor, id: "visit-1", at: "2026-10-23T08:00:00.000Z" }),
    ).toMatchObject({
      id: "visit-1",
      organizationId: "organization-a",
      createdAt: "2026-10-23T08:00:00.000Z",
      updatedAt: "2026-10-23T08:00:00.000Z",
      createdByUserId: "user-1",
      status: "planned",
    });
  });

  it("copies the equipment list instead of sharing it", () => {
    const record = localIntervention(fields, { ...actor, id: "visit-1", at: "now" });
    expect(record.equipmentIds).toEqual(fields.equipmentIds);
    expect(record.equipmentIds).not.toBe(fields.equipmentIds);
  });
});
