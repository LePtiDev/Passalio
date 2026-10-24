import { describe, expect, it } from "vitest";
import { parisInstant, shiftParisDay } from "./paris-time";

describe("parisInstant", () => {
  it.each([
    ["2026-01-15", "18:00", "2026-01-15T17:00:00.000Z"],
    ["2026-07-15", "18:00", "2026-07-15T16:00:00.000Z"],
    ["2026-03-28", "18:00", "2026-03-28T17:00:00.000Z"],
    ["2026-03-29", "18:00", "2026-03-29T16:00:00.000Z"],
    ["2026-10-24", "18:00", "2026-10-24T16:00:00.000Z"],
    ["2026-10-25", "18:00", "2026-10-25T17:00:00.000Z"],
    ["2026-10-25", "00:00", "2026-10-24T22:00:00.000Z"],
    ["2026-10-26", "00:00", "2026-10-25T23:00:00.000Z"],
    ["2027-01-01", "00:00", "2026-12-31T23:00:00.000Z"],
  ])("places %s at %s Paris time at %s", (day, time, expected) => {
    expect(parisInstant(day, time).toISOString()).toBe(expected);
  });
});

describe("shiftParisDay", () => {
  it.each([
    ["2026-10-24", 1, "2026-10-25"],
    ["2026-10-24", -1, "2026-10-23"],
    ["2026-03-01", -1, "2026-02-28"],
    ["2028-03-01", -1, "2028-02-29"],
    ["2026-12-31", 1, "2027-01-01"],
  ])("moves %s by %i days to %s", (day, days, expected) => {
    expect(shiftParisDay(day, days)).toBe(expected);
  });
});
