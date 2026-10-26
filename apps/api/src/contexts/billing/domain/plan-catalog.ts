import type { BillingInterval, Plan } from "@passalio/shared";

export type PricedPlan = {
  readonly plan: Plan;
  readonly interval: BillingInterval;
  readonly isFounder: boolean;
};

export const FOUNDER_LOOKUP_KEY = "founder_monthly";

const PRICE_LOOKUP_KEYS: Readonly<Record<Plan, Readonly<Record<BillingInterval, string>>>> = {
  solo: { month: "solo_monthly", year: "solo_yearly" },
  team: { month: "team_monthly", year: "team_yearly" },
};

const PRICED_PLANS: ReadonlyMap<string, PricedPlan> = new Map([
  ["solo_monthly", { plan: "solo", interval: "month", isFounder: false }],
  ["solo_yearly", { plan: "solo", interval: "year", isFounder: false }],
  ["team_monthly", { plan: "team", interval: "month", isFounder: false }],
  ["team_yearly", { plan: "team", interval: "year", isFounder: false }],
  [FOUNDER_LOOKUP_KEY, { plan: "team", interval: "month", isFounder: true }],
]);

export const lookupKeyOf = (plan: Plan, interval: BillingInterval): string =>
  PRICE_LOOKUP_KEYS[plan][interval];

export const pricedPlanOf = (lookupKey: string | null): PricedPlan | undefined =>
  lookupKey === null ? undefined : PRICED_PLANS.get(lookupKey);

export const lookupKeyOfPricedPlan = ({ plan, interval, isFounder }: PricedPlan): string =>
  isFounder ? FOUNDER_LOOKUP_KEY : lookupKeyOf(plan, interval);
