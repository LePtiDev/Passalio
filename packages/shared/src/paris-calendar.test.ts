import { describe, expect, it } from "vitest";
import { lastMonths, monthOfDay, parisDay, parisDayBefore } from "./paris-calendar";

describe("paris calendar", () => {
  it("uses the Paris day, not the UTC day", () => {
    expect(parisDay(new Date("2026-10-22T22:30:00Z"))).toBe("2026-10-23");
  });

  it("counts days back from a date", () => {
    expect(parisDayBefore(new Date("2026-10-23T10:00:00Z"), 29)).toBe("2026-09-24");
  });

  it("lists the last months, oldest first, across a year change", () => {
    expect(lastMonths(new Date("2026-02-10T10:00:00Z"), 4)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("gives the month of a day", () => {
    expect(monthOfDay("2026-10-23")).toBe("2026-10");
  });
});
