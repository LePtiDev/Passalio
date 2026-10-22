import { describe, expect, it } from "vitest";
import {
  calendarDateOf,
  checkCustomerName,
  displayNameOf,
  normalizeSearchText,
  searchRange,
} from "./customer-rules";
import { checkKindOffered, checkReplaceable, parseDetails } from "./equipment-rules";
import { withChanges } from "./record-changes";

const person = {
  kind: "individual" as const,
  firstName: "Élodie",
  lastName: "Lefèvre",
  companyName: null,
};

describe("customer names", () => {
  it("shows a person as last name then first name", () => {
    expect(displayNameOf(person)).toBe("Lefèvre Élodie");
  });

  it("normalizes accents, case and punctuation for search", () => {
    expect(normalizeSearchText("  L'Éclair-Ramonage SARL ")).toBe("l eclair ramonage sarl");
  });

  it("requires a last name for a person and a company name for a company", () => {
    expect(checkCustomerName({ ...person, lastName: null }).isOk).toBe(false);
    expect(
      checkCustomerName({ kind: "company", firstName: null, lastName: null, companyName: null })
        .isOk,
    ).toBe(false);
    expect(checkCustomerName(person).isOk).toBe(true);
  });

  it("builds a prefix range and ignores an empty query", () => {
    expect(searchRange("Lefè")).toEqual({ from: "lefe", to: "lefe￿" });
    expect(searchRange("  ")).toBeUndefined();
  });
});

describe("calendar dates", () => {
  it("uses the Paris day, not the UTC day", () => {
    expect(calendarDateOf(new Date("2026-10-22T22:30:00Z"))).toBe("2026-10-23");
  });
});

describe("equipment rules", () => {
  it("refuses a heat pump for a chimney sweeping company", () => {
    expect(checkKindOffered("air_to_water_heat_pump", ["chimney_sweeping"]).isOk).toBe(false);
    expect(checkKindOffered("insert", ["chimney_sweeping"]).isOk).toBe(true);
  });

  it("validates details against the equipment family", () => {
    expect(parseDetails("air_to_air_heat_pump", { refrigerant: "r32" })).toEqual({
      isOk: true,
      value: { refrigerant: "R32" },
    });
    expect(parseDetails("insert", { refrigerant: "R32" }).isOk).toBe(false);
    expect(parseDetails("boiler", undefined)).toEqual({ isOk: true, value: {} });
  });

  it("refuses to replace an unknown equipment", () => {
    expect(checkReplaceable(undefined)).toEqual({ isOk: false, error: "equipment_not_found" });
  });

  it("keeps current values when a change is undefined", () => {
    expect(withChanges({ a: 1, b: "x" }, { a: undefined, b: "y" })).toEqual({ a: 1, b: "y" });
  });
});
