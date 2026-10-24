import { syncMutation, type InterventionFields, type ServiceLine } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { createTestDatabase } from "@/lib/db/test-database";
import { createIntervention, localIntervention } from "./intervention-store";

const actor = { userId: "user-1", organizationId: "organization-a" };

const sweeping: ServiceLine = {
  serviceId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6b01",
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
};

const stove: ServiceLine = {
  serviceId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6b02",
  name: "Entretien poêle",
  durationMinutes: 90,
  priceCents: null,
};

const fields: InterventionFields = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  technicianUserId: "user-2",
  technicianUserIds: ["user-2", "user-3"],
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  durationMinutes: 150,
  visitTypes: ["chimney_sweeping", "stove_maintenance"],
  serviceLines: [sweeping, stove],
  equipmentIds: ["6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a03"],
  announcedPriceCents: 8000,
  notes: null,
};

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("createIntervention with several technicians and services", () => {
  it("stores the technicians and the service lines on the local visit", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    expect(await database.interventions.get(interventionId)).toMatchObject({
      technicianUserId: "user-2",
      technicianUserIds: ["user-2", "user-3"],
      serviceLines: [sweeping, stove],
      durationMinutes: 150,
    });
  });

  it("sends the technicians and the service lines in the create_intervention mutation", async () => {
    const interventionId = await createIntervention(database, actor, fields);
    const [entry] = await database.outbox.toArray();
    expect(entry?.mutation).toEqual({
      type: "create_intervention",
      interventionId,
      intervention: fields,
    });
    expect(syncMutation.safeParse(entry?.mutation).success).toBe(true);
  });
});

describe("localIntervention with several technicians and services", () => {
  const context = { ...actor, id: "visit-1", at: "now" };

  it("puts the lead first and collapses duplicated technicians", () => {
    expect(
      localIntervention({ ...fields, technicianUserIds: ["user-3", "user-2", "user-3"] }, context)
        .technicianUserIds,
    ).toEqual(["user-2", "user-3"]);
  });

  it("makes the lead the only technician when no list is given", () => {
    expect(
      localIntervention({ ...fields, technicianUserIds: undefined }, context).technicianUserIds,
    ).toEqual(["user-2"]);
  });

  it("copies the service lines instead of sharing them", () => {
    const record = localIntervention(fields, context);
    expect(record.serviceLines).toEqual(fields.serviceLines);
    expect(record.serviceLines).not.toBe(fields.serviceLines);
  });

  it("gives an empty list when the fields carry no service line", () => {
    expect(localIntervention({ ...fields, serviceLines: undefined }, context).serviceLines).toEqual(
      [],
    );
  });
});
