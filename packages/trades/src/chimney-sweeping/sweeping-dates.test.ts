import { describe, expect, it } from "vitest";
import { sweepingDatesAfter } from "./trade";

describe("sweepingDatesAfter", () => {
  it("dates the equipment from the sweeping when none was known", () => {
    expect(sweepingDatesAfter(null, "2026-10-23")).toEqual({
      lastSweepingOn: "2026-10-23",
      nextDueDate: "2027-10-23",
    });
  });

  it("replaces an older sweeping", () => {
    expect(sweepingDatesAfter("2025-09-01", "2026-10-23")).toEqual({
      lastSweepingOn: "2026-10-23",
      nextDueDate: "2027-10-23",
    });
  });

  it("keeps a later sweeping already known", () => {
    expect(sweepingDatesAfter("2026-11-02", "2026-10-23")).toEqual({
      lastSweepingOn: "2026-11-02",
      nextDueDate: "2027-11-02",
    });
  });
});
