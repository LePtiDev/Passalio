import { describe, expect, it } from "vitest";
import { MIN_PREVIOUS_ACTIVE_DAYS, USAGE_DROP_PERCENT, usageTrend } from "./usage-trend";

describe("usageTrend limits", () => {
  it("uses a 20 % drop over at least 5 days of previous usage", () => {
    expect(USAGE_DROP_PERCENT).toBe(20);
    expect(MIN_PREVIOUS_ACTIVE_DAYS).toBe(5);
  });

  it("flags a drop of exactly 20 %", () => {
    expect(usageTrend(8, 10)).toEqual({
      recent: 8,
      previous: 10,
      changePercent: -20,
      isDropping: true,
    });
  });

  it("does not flag a drop just under 20 %", () => {
    expect(usageTrend(81, 100).isDropping).toBe(false);
  });

  it("flags a drop when the previous period has exactly 5 days", () => {
    expect(usageTrend(4, 5).isDropping).toBe(true);
  });

  it("does not flag a drop when the previous period has 4 days", () => {
    expect(usageTrend(0, 4).isDropping).toBe(false);
  });

  it("never flags a rise", () => {
    expect(usageTrend(30, 10)).toEqual({
      recent: 30,
      previous: 10,
      changePercent: 200,
      isDropping: false,
    });
  });

  it("rounds the change to the nearest percent", () => {
    expect(usageTrend(2, 3).changePercent).toBe(-33);
    expect(usageTrend(1, 3).changePercent).toBe(-67);
  });

  it("has no change when nobody used the account in either period", () => {
    expect(usageTrend(0, 0)).toEqual({
      recent: 0,
      previous: 0,
      changePercent: null,
      isDropping: false,
    });
  });
});
