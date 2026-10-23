import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  plateReadingFieldCount,
  plateReadingFields,
  plateReadingStatusOf,
  sanitizePlateReading,
  type PlateReadingFields,
} from "./plate-reading";

const HEAT_PUMP_ANSWER: PlateReadingFields = {
  kind: "air_to_water_heat_pump",
  energy: "electricity",
  brand: "Fujitsu",
  model: "WOYB060LDC",
  serialNumber: "E000181",
  powerKw: 6,
  refrigerant: "R410A",
  refrigerantChargeKg: 1.1,
};

describe("sanitizePlateReading", () => {
  it("keeps every valid field of a heat pump plate", () => {
    expect(sanitizePlateReading(HEAT_PUMP_ANSWER)).toEqual(HEAT_PUMP_ANSWER);
  });

  it("drops null fields", () => {
    expect(
      sanitizePlateReading({ ...HEAT_PUMP_ANSWER, serialNumber: null, powerKw: null }),
    ).not.toHaveProperty("serialNumber");
  });

  it("drops a kind outside the known appliances", () => {
    expect(sanitizePlateReading({ kind: "toaster", brand: "Supra" })).toEqual({ brand: "Supra" });
  });

  it("drops an energy outside the known energies", () => {
    expect(sanitizePlateReading({ energy: "nuclear", brand: "Supra" })).toEqual({
      brand: "Supra",
    });
  });

  it("collapses spaces and trims texts", () => {
    expect(sanitizePlateReading({ model: "  Ego 2.0   Air 8 \n" })).toEqual({
      model: "Ego 2.0 Air 8",
    });
  });

  it("drops an empty text or a text without any letter or digit", () => {
    expect(sanitizePlateReading({ brand: "   ", model: "---", serialNumber: "" })).toEqual({});
  });

  it("drops a text longer than 120 characters", () => {
    expect(sanitizePlateReading({ model: "A".repeat(121) })).toEqual({});
  });

  it("keeps a text of exactly 120 characters", () => {
    expect(sanitizePlateReading({ model: "A".repeat(120) })).toEqual({ model: "A".repeat(120) });
  });

  it("drops a power that is zero, negative, too high or not a number", () => {
    for (const powerKw of [0, -3, 2000.5, Number.NaN, Number.POSITIVE_INFINITY, "8"]) {
      expect(sanitizePlateReading({ powerKw })).toEqual({});
    }
  });

  it("drops a power or a charge that rounds to zero", () => {
    expect(sanitizePlateReading({ powerKw: 0.001, refrigerantChargeKg: 5e-324 })).toEqual({});
  });

  it("rounds a power to two decimals", () => {
    expect(sanitizePlateReading({ powerKw: 8.456 })).toEqual({ powerKw: 8.46 });
  });

  it("normalizes a refrigerant written with a dash, a space or in lower case", () => {
    expect(sanitizePlateReading({ refrigerant: "r-410 a" })).toEqual({ refrigerant: "R410A" });
  });

  it("drops a refrigerant that is not a refrigerant name", () => {
    expect(sanitizePlateReading({ refrigerant: "Fluide frigorigène" })).toEqual({});
  });

  it("drops refrigerant and charge on an appliance that has none", () => {
    expect(
      sanitizePlateReading({ kind: "boiler", refrigerant: "R32", refrigerantChargeKg: 1.2 }),
    ).toEqual({ kind: "boiler" });
  });

  it("keeps refrigerant and charge when the kind is unknown", () => {
    expect(sanitizePlateReading({ refrigerant: "R32", refrigerantChargeKg: 1.2 })).toEqual({
      refrigerant: "R32",
      refrigerantChargeKg: 1.2,
    });
  });

  it("ignores fields that are not part of the form", () => {
    expect(sanitizePlateReading({ brand: "MCZ", ownerName: "Martine Lefort" })).toEqual({
      brand: "MCZ",
    });
  });

  it("returns no field for an answer that is not an object", () => {
    for (const answer of [null, undefined, "MCZ", 42, ["MCZ"]]) {
      expect(sanitizePlateReading(answer)).toEqual({});
    }
  });

  it("always returns fields that the response schema accepts, whatever the model answers", () => {
    fc.assert(
      fc.property(fc.anything(), (answer) => {
        expect(plateReadingFields.safeParse(sanitizePlateReading(answer)).success).toBe(true);
      }),
    );
  });

  it("always returns fields that the response schema accepts for plate-shaped answers", () => {
    const answer = fc.record({
      kind: fc.oneof(fc.constantFrom("boiler", "pellet_stove", "air_conditioner"), fc.string()),
      energy: fc.oneof(fc.constantFrom("gas", "pellets"), fc.string()),
      brand: fc.oneof(fc.string(), fc.constant(null)),
      model: fc.oneof(fc.string(), fc.constant(null)),
      serialNumber: fc.oneof(fc.string(), fc.constant(null)),
      powerKw: fc.oneof(fc.double(), fc.constant(null)),
      refrigerant: fc.oneof(fc.string(), fc.constant(null)),
      refrigerantChargeKg: fc.oneof(fc.double(), fc.constant(null)),
    });
    fc.assert(
      fc.property(answer, (value) => {
        expect(plateReadingFields.safeParse(sanitizePlateReading(value)).success).toBe(true);
      }),
    );
  });
});

describe("plateReadingStatusOf", () => {
  it("is read when brand, model and serial number are present", () => {
    expect(plateReadingStatusOf({ brand: "MCZ", model: "Ego", serialNumber: "21-04" })).toBe(
      "read",
    );
  });

  it("is partial when one of brand, model or serial number is missing", () => {
    expect(plateReadingStatusOf({ brand: "MCZ", model: "Ego", powerKw: 8 })).toBe("partial");
  });

  it("is partial with a single field", () => {
    expect(plateReadingStatusOf({ powerKw: 8 })).toBe("partial");
  });

  it("is unreadable without any field", () => {
    expect(plateReadingStatusOf({})).toBe("unreadable");
  });
});

describe("plateReadingFieldCount", () => {
  it("counts the fields that were read", () => {
    expect(plateReadingFieldCount(HEAT_PUMP_ANSWER)).toBe(8);
    expect(plateReadingFieldCount({ brand: "MCZ" })).toBe(1);
    expect(plateReadingFieldCount({})).toBe(0);
  });
});
