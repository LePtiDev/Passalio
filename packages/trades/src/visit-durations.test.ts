import { describe, expect, it } from "vitest";
import { TRADE_IDS } from "./trade-ids";
import {
  DEFAULT_VISIT_MINUTES,
  isVisitType,
  MAX_VISIT_DURATION_MINUTES,
  MIN_VISIT_DURATION_MINUTES,
  totalVisitMinutes,
  VISIT_DURATION_STEP_MINUTES,
  visitDurationMinutes,
  visitDurations,
  visitMinutesOf,
  visitTypes,
} from "./visit-durations";

describe("DEFAULT_VISIT_MINUTES", () => {
  it("gives each trade the default duration chosen by the founder", () => {
    expect(DEFAULT_VISIT_MINUTES).toEqual({
      chimney_sweeping: 60,
      stove_maintenance: 90,
      boiler_maintenance: 60,
      heat_pump_maintenance: 90,
      septic_tank_emptying: 120,
    });
  });

  it("keeps every default duration within the allowed bounds", () => {
    for (const tradeId of TRADE_IDS) {
      expect(visitDurationMinutes.safeParse(DEFAULT_VISIT_MINUTES[tradeId]).success).toBe(true);
    }
  });
});

describe("visitDurationMinutes", () => {
  it("allows durations from 15 minutes to 8 hours in steps of 15 minutes", () => {
    expect(VISIT_DURATION_STEP_MINUTES).toBe(15);
    expect(MIN_VISIT_DURATION_MINUTES).toBe(15);
    expect(MAX_VISIT_DURATION_MINUTES).toBe(480);
  });

  it.each([15, 30, 45, 60, 105, 465, 480])("accepts %i minutes", (minutes) => {
    expect(visitDurationMinutes.safeParse(minutes).success).toBe(true);
  });

  it.each([0, -15, 10, 14, 20, 50, 61, 495, 600, 60.5])("refuses %d minutes", (minutes) => {
    expect(visitDurationMinutes.safeParse(minutes).success).toBe(false);
  });

  it("refuses a duration that is not a number", () => {
    expect(visitDurationMinutes.safeParse("60").success).toBe(false);
  });
});

describe("visitDurations", () => {
  it("accepts a partial set of durations", () => {
    expect(visitDurations.safeParse({ chimney_sweeping: 45 })).toEqual({
      success: true,
      data: { chimney_sweeping: 45 },
    });
  });

  it("accepts an empty set of durations", () => {
    expect(visitDurations.safeParse({}).success).toBe(true);
  });

  it("refuses a type that is not a trade", () => {
    expect(visitDurations.safeParse({ plumbing: 60 }).success).toBe(false);
  });

  it("refuses a duration out of bounds or off the 15-minute step", () => {
    expect(visitDurations.safeParse({ chimney_sweeping: 0 }).success).toBe(false);
    expect(visitDurations.safeParse({ chimney_sweeping: 495 }).success).toBe(false);
    expect(visitDurations.safeParse({ chimney_sweeping: 50 }).success).toBe(false);
  });
});

describe("visitTypes", () => {
  it("accepts a list of trades", () => {
    expect(visitTypes.safeParse(["chimney_sweeping", "boiler_maintenance"]).success).toBe(true);
  });

  it("refuses a type that is not a trade", () => {
    expect(visitTypes.safeParse(["chimney_sweeping", "plumbing"]).success).toBe(false);
  });
});

describe("isVisitType", () => {
  it.each(TRADE_IDS)("recognises %s as a visit type", (tradeId) => {
    expect(isVisitType(tradeId)).toBe(true);
  });

  it.each(["plumbing", "", "Chimney_sweeping", "chimney sweeping"])(
    "does not recognise %j as a visit type",
    (value) => {
      expect(isVisitType(value)).toBe(false);
    },
  );
});

describe("visitMinutesOf", () => {
  it("uses the duration chosen by the company", () => {
    expect(visitMinutesOf("chimney_sweeping", { chimney_sweeping: 45 })).toBe(45);
  });

  it("falls back to the default duration when the company did not choose one", () => {
    expect(visitMinutesOf("septic_tank_emptying", { chimney_sweeping: 45 })).toBe(120);
    expect(visitMinutesOf("stove_maintenance", {})).toBe(90);
  });
});

describe("totalVisitMinutes", () => {
  it("adds up the durations of every type of the visit", () => {
    expect(totalVisitMinutes(["chimney_sweeping", "stove_maintenance"], {})).toBe(150);
  });

  it("adds up company durations and default durations together", () => {
    expect(
      totalVisitMinutes(["chimney_sweeping", "boiler_maintenance"], { chimney_sweeping: 30 }),
    ).toBe(90);
  });

  it("gives zero minutes to a visit without type", () => {
    expect(totalVisitMinutes([], { chimney_sweeping: 30 })).toBe(0);
  });

  it("gives the duration of the single type of a visit", () => {
    expect(totalVisitMinutes(["heat_pump_maintenance"], { heat_pump_maintenance: 75 })).toBe(75);
  });
});
