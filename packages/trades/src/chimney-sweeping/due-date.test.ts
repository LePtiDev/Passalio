import { describe, expect, it } from "vitest";
import { addMonths } from "./due-date";
import { nextSweepingDueDate } from "./trade";

describe("addMonths", () => {
  it("adds months within the same year and across years", () => {
    expect(addMonths("2026-03-15", 2)).toBe("2026-05-15");
    expect(addMonths("2026-10-23", 12)).toBe("2027-10-23");
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
  });

  it("keeps the last day of a shorter month", () => {
    expect(addMonths("2028-02-29", 12)).toBe("2029-02-28");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("nextSweepingDueDate", () => {
  it("is twelve months after the completion of the sweeping", () => {
    expect(nextSweepingDueDate("2026-10-23")).toBe("2027-10-23");
  });
});
