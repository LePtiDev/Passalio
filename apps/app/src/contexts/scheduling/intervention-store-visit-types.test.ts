import { syncMutation, type InterventionFields } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { createTestDatabase } from "@/lib/db/test-database";
import { createIntervention, localIntervention } from "./intervention-store";

const actor = { userId: "user-1", organizationId: "organization-a" };

const fields: InterventionFields = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  technicianUserId: "user-2",
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  durationMinutes: 150,
  visitTypes: ["chimney_sweeping", "stove_maintenance"],
  equipmentIds: ["6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a03"],
  announcedPriceCents: 7550,
  notes: null,
};

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("createIntervention with visit types", () => {
  it("stores the visit types and the duration on the local visit", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    expect(await database.interventions.get(interventionId)).toMatchObject({
      visitTypes: ["chimney_sweeping", "stove_maintenance"],
      durationMinutes: 150,
    });
  });

  it("sends the visit types in the create_intervention mutation", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    const [entry] = await database.outbox.toArray();
    expect(entry?.mutation).toEqual({
      type: "create_intervention",
      interventionId,
      intervention: fields,
    });
    expect(syncMutation.safeParse(entry?.mutation).success).toBe(true);
  });

  it("stores an empty list when the visit has no type", async () => {
    const interventionId = await createIntervention(database, actor, {
      ...fields,
      durationMinutes: 60,
      visitTypes: [],
    });
    expect((await database.interventions.get(interventionId))?.visitTypes).toEqual([]);
  });
});

describe("localIntervention with visit types", () => {
  it("copies the visit types instead of sharing them", () => {
    const record = localIntervention(fields, { ...actor, id: "visit-1", at: "now" });
    expect(record.visitTypes).toEqual(fields.visitTypes);
    expect(record.visitTypes).not.toBe(fields.visitTypes);
  });

  it("gives an empty list when the fields carry no visit types", () => {
    expect(
      localIntervention(
        { ...fields, visitTypes: undefined },
        { ...actor, id: "visit-1", at: "now" },
      ).visitTypes,
    ).toEqual([]);
  });
});
