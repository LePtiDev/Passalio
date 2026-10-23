import { describe, expect, it } from "vitest";
import { shortDayLabel } from "./date-labels";

describe("shortDayLabel", () => {
  const now = new Date("2026-10-23T10:00:00Z");

  it("shows day and month during the current year", () => {
    expect(shortDayLabel("2026-10-19T08:00:00Z", now)).toBe("19 oct.");
  });

  it("adds the year for an older date", () => {
    expect(shortDayLabel("2025-12-31T08:00:00Z", now)).toBe("31 déc. 2025");
  });
});
