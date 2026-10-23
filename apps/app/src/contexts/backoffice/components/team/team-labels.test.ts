import { describe, expect, it } from "vitest";
import { daysLeft, lastSignInLabel } from "./team-labels";

const NOW = new Date("2026-10-23T14:40:00Z");

describe("lastSignInLabel", () => {
  it("shows the time for today and yesterday, in Paris time", () => {
    expect(lastSignInLabel("2026-10-23T12:31:00Z", NOW)).toBe("Aujourd'hui, 14:31");
    expect(lastSignInLabel("2026-10-22T16:40:00Z", NOW)).toBe("Hier, 18:40");
  });

  it("shows a short date before, and never when there is no sign-in", () => {
    expect(lastSignInLabel("2026-10-12T09:00:00Z", NOW)).toBe("12 oct.");
    expect(lastSignInLabel(null, NOW)).toBe("Jamais");
  });
});

describe("daysLeft", () => {
  it("rounds up the days before expiry", () => {
    expect(daysLeft("2026-10-30T14:40:00Z", NOW)).toBe(7);
    expect(daysLeft("2026-10-23T15:00:00Z", NOW)).toBe(1);
    expect(daysLeft("2026-10-22T15:00:00Z", NOW)).toBe(0);
  });
});
