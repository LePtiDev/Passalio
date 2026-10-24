import type { EquipmentKind } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import {
  emptyEquipmentForm,
  type EquipmentFormValues,
} from "./components/equipment/equipment-form-schema";
import { mergePlateReading } from "./plate-reading";

const ALL_KINDS: readonly EquipmentKind[] = [
  "open_fireplace",
  "insert",
  "log_stove",
  "pellet_stove",
  "boiler",
  "solid_fuel_cooker",
  "air_to_water_heat_pump",
  "air_to_air_heat_pump",
  "air_conditioner",
];

const EMPTY = emptyEquipmentForm(undefined);

const form = (values: Partial<EquipmentFormValues> = {}): EquipmentFormValues => ({
  ...EMPTY,
  ...values,
});

const PELLET_STOVE = {
  kind: "pellet_stove",
  energy: "pellets",
  brand: "MCZ",
  model: "Ego 2.0 Air 8",
  powerKw: 8,
} as const;

describe("mergePlateReading", () => {
  it("fills every empty field read on the plate and lists the identity fields not read", () => {
    expect(mergePlateReading(form(), PELLET_STOVE, ALL_KINDS)).toEqual({
      values: {
        kind: "pellet_stove",
        energy: "pellets",
        brand: "MCZ",
        model: "Ego 2.0 Air 8",
        powerKw: "8",
      },
      defaults: {},
      missingIdentity: ["serialNumber"],
    });
  });

  it("never overwrites a value the technician already typed or chose", () => {
    const merge = mergePlateReading(
      form({ kind: "log_stove", energy: "wood_logs", model: "Mon modèle", powerKw: "7" }),
      PELLET_STOVE,
      ALL_KINDS,
    );
    expect(merge.values).toEqual({ brand: "MCZ" });
  });

  it("treats a field with only spaces as empty", () => {
    expect(mergePlateReading(form({ brand: "   " }), PELLET_STOVE, ALL_KINDS).values.brand).toBe(
      "MCZ",
    );
  });

  it("ignores a kind that the company's trades do not offer", () => {
    const merge = mergePlateReading(form(), PELLET_STOVE, ["boiler", "insert"]);
    expect(merge.values.kind).toBeUndefined();
    expect(merge.values.brand).toBe("MCZ");
  });

  it("gives the usual fuel of a read kind when the plate does not show it, without marking it read", () => {
    const merge = mergePlateReading(form(), { kind: "log_stove", brand: "Jøtul" }, ALL_KINDS);
    expect(merge.values).toEqual({ kind: "log_stove", brand: "Jøtul" });
    expect(merge.defaults).toEqual({ energy: "wood_logs" });
  });

  it("writes numbers the French way, with two decimals for a refrigerant charge", () => {
    const merge = mergePlateReading(
      form(),
      {
        kind: "air_to_water_heat_pump",
        powerKw: 11.2,
        refrigerant: "R32",
        refrigerantChargeKg: 1.4,
      },
      ALL_KINDS,
    );
    expect(merge.values).toMatchObject({
      powerKw: "11,2",
      refrigerant: "R32",
      refrigerantCharge: "1,40",
    });
  });

  it("keeps the refrigerant and the fuel off an appliance that is not a heat pump", () => {
    const merge = mergePlateReading(
      form({ kind: "boiler" }),
      { energy: "gas", refrigerant: "R32", refrigerantChargeKg: 1.4 },
      ALL_KINDS,
    );
    expect(merge.values).toEqual({ energy: "gas" });
  });

  it("keeps the fuel off a heat pump", () => {
    const merge = mergePlateReading(
      form({ kind: "air_to_air_heat_pump" }),
      { energy: "gas", refrigerant: "R410A" },
      ALL_KINDS,
    );
    expect(merge.values).toEqual({ refrigerant: "R410A" });
  });

  it("does not list an identity field the technician already typed as missing", () => {
    expect(
      mergePlateReading(form({ serialNumber: "21-04587" }), PELLET_STOVE, ALL_KINDS)
        .missingIdentity,
    ).toEqual([]);
  });

  it("fills nothing and lists all identity fields for an empty reading", () => {
    expect(mergePlateReading(form(), {}, ALL_KINDS)).toEqual({
      values: {},
      defaults: {},
      missingIdentity: ["brand", "model", "serialNumber"],
    });
  });
});
