import { describe, expect, it } from "vitest";
import { hasFreeTechnicianSeat, isLimitedToSolo } from "./technician-seats";

const ENDED_AT = new Date("2026-11-20T12:00:00.000Z");

describe("technician seats", () => {
  it("leaves the seats open during the trial, before any subscription", () => {
    expect(hasFreeTechnicianSeat(null, 4)).toBe(true);
  });

  it("leaves the seats open with the Équipe plan", () => {
    expect(hasFreeTechnicianSeat({ plan: "team", endedAt: null }, 6)).toBe(true);
  });

  it("gives Solo a single technician seat", () => {
    expect(hasFreeTechnicianSeat({ plan: "solo", endedAt: null }, 0)).toBe(true);
    expect(hasFreeTechnicianSeat({ plan: "solo", endedAt: null }, 1)).toBe(false);
  });

  it("no longer limits a Solo subscription that has ended", () => {
    expect(isLimitedToSolo({ plan: "solo", endedAt: ENDED_AT })).toBe(false);
    expect(hasFreeTechnicianSeat({ plan: "solo", endedAt: ENDED_AT }, 3)).toBe(true);
  });
});
