import { describe, expect, it } from "vitest";
import { TRADE_IDS } from "./trade-ids";
import {
  DEFAULT_VISIT_MINUTES,
  isVisitType,
  MAX_VISIT_DURATION_MINUTES,
  MIN_VISIT_DURATION_MINUTES,
  VISIT_DURATION_STEP_MINUTES,
  visitDurationMinutes,
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
