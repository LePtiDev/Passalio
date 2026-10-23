import { describe, expect, it } from "vitest";
import { equipmentUpdates, newEquipment } from "./equipment-records";

const AT = new Date("2026-10-23T10:00:00Z");
const context = {
  id: "equipment-1",
  organizationId: "organization-a",
  siteId: "site-1",
  at: AT,
  organizationTrades: ["chimney_sweeping", "boiler_maintenance"] as const,
};

describe("newEquipment", () => {
  it("builds an active equipment with no due date yet", () => {
    const created = newEquipment({ kind: "log_stove", details: { flueType: "metal" } }, context);
    expect(created.isOk && created.value).toMatchObject({
      id: "equipment-1",
      organizationId: "organization-a",
      siteId: "site-1",
      kind: "log_stove",
      energy: null,
      details: { flueType: "metal" },
      status: "active",
      isInstalledByUs: false,
      removedOn: null,
      replacedByEquipmentId: null,
      nextDueDate: null,
      createdAt: AT,
      updatedAt: AT,
    });
  });

  it("gives empty details when none are sent", () => {
    const created = newEquipment({ kind: "boiler" }, context);
    expect(created.isOk && created.value.details).toEqual({});
  });

  it("refuses a kind that the company trades do not cover", () => {
    expect(newEquipment({ kind: "air_to_water_heat_pump" }, context)).toEqual({
      isOk: false,
      error: "equipment_kind_not_offered",
    });
  });

  it("refuses details of another family", () => {
    expect(newEquipment({ kind: "boiler", details: { refrigerant: "R32" } }, context)).toEqual({
      isOk: false,
      error: "invalid_equipment_details",
    });
  });
});

describe("equipmentUpdates", () => {
  const created = newEquipment({ kind: "boiler", details: { boilerType: "condensing" } }, context);
  if (!created.isOk) {
    throw new Error("equipment fixture is invalid");
  }
  const current = created.value;

  it("keeps the current details and dates the change", () => {
    expect(equipmentUpdates(current, { brand: "Atlantic" }, context)).toEqual({
      isOk: true,
      value: { brand: "Atlantic", details: { boilerType: "condensing" }, updatedAt: AT },
    });
  });

  it("does not check the trades when the kind stays the same", () => {
    expect(
      equipmentUpdates(current, { kind: "boiler" }, { at: AT, organizationTrades: [] }).isOk,
    ).toBe(true);
  });

  it("refuses a new kind that the company trades do not cover", () => {
    expect(
      equipmentUpdates(current, { kind: "air_to_water_heat_pump", details: {} }, context),
    ).toEqual({ isOk: false, error: "equipment_kind_not_offered" });
  });

  it("refuses details that do not fit the equipment", () => {
    expect(equipmentUpdates(current, { details: { refrigerant: "R32" } }, context)).toEqual({
      isOk: false,
      error: "invalid_equipment_details",
    });
  });
});
