import { describe, expect, it } from "vitest";
import { activityWindow, trialEndOf } from "./activity-window";
import { usageTrend } from "./usage-trend";

describe("usage trend", () => {
  it("flags a drop of 20 % or more", () => {
    expect(usageTrend(61, 98)).toEqual({
      recent: 61,
      previous: 98,
      changePercent: -38,
      isDropping: true,
    });
  });

  it("ignores a small drop", () => {
    expect(usageTrend(90, 98).isDropping).toBe(false);
  });

  it("ignores accounts that were barely used before", () => {
    expect(usageTrend(0, 4)).toMatchObject({ changePercent: -100, isDropping: false });
  });

  it("has no change for a new account", () => {
    expect(usageTrend(12, 0)).toMatchObject({ changePercent: null, isDropping: false });
  });
});

describe("activity window", () => {
  it("compares the last 30 days with the 30 days before, over six months", () => {
    expect(activityWindow(new Date("2026-10-23T10:00:00Z"))).toEqual({
      today: "2026-10-23",
      recentStart: "2026-09-24",
      previousStart: "2026-08-25",
      months: ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"],
      historyStart: "2026-05-01",
      trialStartedAfter: new Date("2026-10-16T10:00:00Z"),
    });
  });

  it("ends the free trial 7 days after the account is created", () => {
    expect(trialEndOf(new Date("2026-10-20T08:00:00Z"))).toEqual(new Date("2026-10-27T08:00:00Z"));
  });
});
