import { describe, expect, it } from "vitest";
import { isKindOffered, offeredKinds } from "./equipment-catalog";
import { detailsSchemaOf } from "./equipment-details";

describe("offeredKinds", () => {
  it("offers only flue appliances to a chimney sweep", () => {
    expect(offeredKinds(["chimney_sweeping"])).toEqual([
      "open_fireplace",
      "insert",
      "log_stove",
      "pellet_stove",
      "boiler",
      "solid_fuel_cooker",
    ]);
  });

  it("offers heat pumps only to a company that services them", () => {
    expect(isKindOffered("air_to_water_heat_pump", ["chimney_sweeping"])).toBe(false);
    expect(isKindOffered("air_to_water_heat_pump", ["heat_pump_maintenance"])).toBe(true);
  });

  it("offers nothing when no trade is chosen", () => {
    expect(offeredKinds([])).toEqual([]);
  });
});

describe("detailsSchemaOf", () => {
  it("accepts the refrigerant and its charge for a heat pump", () => {
    const parsed = detailsSchemaOf("air_to_water_heat_pump").safeParse({
      refrigerant: "r32",
      refrigerantChargeKg: 1.4,
    });
    expect(parsed.success && parsed.data).toEqual({ refrigerant: "R32", refrigerantChargeKg: 1.4 });
  });

  it("refuses heat pump fields on a stove", () => {
    expect(detailsSchemaOf("insert").safeParse({ refrigerant: "R32" }).success).toBe(false);
  });

  it("keeps the flue on a boiler", () => {
    const parsed = detailsSchemaOf("boiler").safeParse({
      flueType: "lined_masonry",
      boilerType: "condensing",
    });
    expect(parsed.success).toBe(true);
  });
});
