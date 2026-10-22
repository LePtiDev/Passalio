import { describe, expect, it } from "vitest";
import { daysUntil, formatShortDate, formatShortDateWithYear } from "./format-date";

const NOW = new Date("2026-10-22T10:00:00Z");

describe("format-date", () => {
  it("formats short French dates", () => {
    expect(formatShortDate(NOW)).toBe("22 oct.");
    expect(formatShortDateWithYear(NOW)).toBe("22 oct. 2026");
  });

  it("counts started days until a date, negative once past", () => {
    expect(daysUntil(new Date("2026-10-28T09:00:00Z"), NOW)).toBe(6);
    expect(daysUntil(new Date("2026-10-22T11:00:00Z"), NOW)).toBe(1);
    expect(daysUntil(new Date("2026-10-21T10:00:00Z"), NOW)).toBe(-1);
  });
});
