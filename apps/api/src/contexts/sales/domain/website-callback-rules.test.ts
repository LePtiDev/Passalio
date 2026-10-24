import { describe, expect, it } from "vitest";
import { callbackDueAt, departmentOfPostalCode, spacedPhone } from "./website-callback-rules";

describe("departmentOfPostalCode", () => {
  it.each([
    ["94100", "94"],
    ["75011", "75"],
    ["01000", "01"],
    ["20000", "2A"],
    ["20190", "2A"],
    ["20200", "2B"],
    ["20600", "2B"],
    ["97400", "974"],
    ["97100", "971"],
  ])("gives %s the department %s", (postalCode, department) => {
    expect(departmentOfPostalCode(postalCode)).toBe(department);
  });
});

describe("callbackDueAt", () => {
  it.each([
    ["morning", "2026-06-11T06:00:00Z"],
    ["noon", "2026-06-11T10:00:00Z"],
    ["afternoon", "2026-06-11T12:00:00Z"],
    ["evening", "2026-06-11T16:00:00Z"],
  ] as const)("starts the %s slot tomorrow, Paris summer time", (slot, expected) => {
    expect(callbackDueAt(slot, new Date("2026-06-10T09:00:00Z"))).toEqual(new Date(expected));
  });

  it("follows the change to winter time", () => {
    expect(callbackDueAt("morning", new Date("2026-10-24T20:00:00Z"))).toEqual(
      new Date("2026-10-25T07:00:00Z"),
    );
  });

  it("uses the Paris day, not the UTC day, late in the evening", () => {
    expect(callbackDueAt("morning", new Date("2026-06-10T22:30:00Z"))).toEqual(
      new Date("2026-06-12T06:00:00Z"),
    );
  });
});

describe("spacedPhone", () => {
  it("writes a phone number in pairs, as stored for prospects", () => {
    expect(spacedPhone("0492509006")).toBe("04 92 50 90 06");
  });
});
