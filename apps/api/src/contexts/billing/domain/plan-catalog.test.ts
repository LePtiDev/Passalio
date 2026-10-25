import { describe, expect, it } from "vitest";
import { FOUNDER_LOOKUP_KEY, lookupKeyOf, pricedPlanOf } from "./plan-catalog";

describe("plan catalog", () => {
  it.each([
    ["solo", "month", "solo_monthly"],
    ["solo", "year", "solo_yearly"],
    ["team", "month", "team_monthly"],
    ["team", "year", "team_yearly"],
  ] as const)(
    "finds the %s %s price by the lookup key %s of docs/stripe.md",
    (plan, interval, key) => {
      expect(lookupKeyOf(plan, interval)).toBe(key);
      expect(pricedPlanOf(key)).toEqual({ plan, interval, isFounder: false });
    },
  );

  it("reads the founder price as the monthly Équipe plan with the founder offer", () => {
    expect(pricedPlanOf(FOUNDER_LOOKUP_KEY)).toEqual({
      plan: "team",
      interval: "month",
      isFounder: true,
    });
  });

  it.each([null, "team_weekly", ""])("knows no plan for the lookup key %s", (key) => {
    expect(pricedPlanOf(key)).toBeUndefined();
  });
});
