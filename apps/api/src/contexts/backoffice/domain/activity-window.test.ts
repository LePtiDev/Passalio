import { describe, expect, it } from "vitest";
import { activityWindow, TRIAL_DAYS, trialEndOf, USAGE_HISTORY_MONTHS } from "./activity-window";

describe("activityWindow in Paris time", () => {
  it("keeps a 7-day trial and six months of history", () => {
    expect(TRIAL_DAYS).toBe(7);
    expect(USAGE_HISTORY_MONTHS).toBe(6);
  });

  it("counts a late UTC evening as the next day in Paris", () => {
    const window = activityWindow(new Date("2026-10-23T22:30:00Z"));
    expect(window.today).toBe("2026-10-24");
    expect(window.recentStart).toBe("2026-09-25");
    expect(window.previousStart).toBe("2026-08-26");
  });

  it("moves to the new month at midnight in Paris on the first day", () => {
    const window = activityWindow(new Date("2026-10-31T23:30:00Z"));
    expect(window.months).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    expect(window.historyStart).toBe("2026-06-01");
  });

  it("spans the turn of the year", () => {
    const window = activityWindow(new Date("2027-02-10T12:00:00Z"));
    expect(window.months).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });

  it("starts the trial window exactly 7 days before now", () => {
    expect(activityWindow(new Date("2026-03-30T12:00:00Z")).trialStartedAfter).toEqual(
      new Date("2026-03-23T12:00:00Z"),
    );
  });

  it("ends the trial 7 days of 24 hours after creation, whatever the daylight saving change", () => {
    expect(trialEndOf(new Date("2026-03-25T12:00:00Z"))).toEqual(new Date("2026-04-01T12:00:00Z"));
  });
});
