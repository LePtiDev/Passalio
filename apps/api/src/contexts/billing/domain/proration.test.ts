import { describe, expect, it } from "vitest";
import { dateOfUnixSeconds, isFreshProrationDate, unixSecondsOf } from "./proration";

const NOW = new Date("2026-11-20T12:00:00.000Z");
const seconds = unixSecondsOf(NOW);

describe("proration date", () => {
  it("drops the milliseconds, as Stripe counts in seconds", () => {
    expect(unixSecondsOf(new Date("2026-11-20T12:00:00.900Z"))).toBe(seconds);
    expect(dateOfUnixSeconds(seconds)).toEqual(NOW);
  });

  it.each([
    ["now", 0, true],
    ["twenty-nine minutes ago", -29 * 60, true],
    ["thirty minutes ago", -30 * 60, true],
    ["thirty-one minutes ago", -31 * 60, false],
    ["thirty seconds ahead, a clock gap", 30, true],
    ["two minutes ahead", 120, false],
  ])("judges a preview made %s", (_label, offset, isFresh) => {
    expect(isFreshProrationDate(seconds + offset, NOW)).toBe(isFresh);
  });
});
