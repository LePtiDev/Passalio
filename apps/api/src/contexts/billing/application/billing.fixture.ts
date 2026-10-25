import type { StripeSubscriptionSnapshot, Subscription } from "../domain/billing-models";

export const ORGANIZATION_ID = "organization-a";
export const CREATED_AT = new Date("2026-11-02T09:00:00.000Z");
export const DURING_TRIAL = new Date("2026-11-05T12:00:00.000Z");
export const AFTER_TRIAL = new Date("2026-11-20T12:00:00.000Z");
export const PERIOD_END = new Date("2026-12-20T12:00:00.000Z");

export const aSubscription = (changes: Partial<Subscription> = {}): Subscription => ({
  id: "subscription-a",
  organizationId: ORGANIZATION_ID,
  plan: "team",
  interval: "month",
  isFounder: false,
  status: "active",
  stripeCustomerId: "cus_ramonage",
  stripeSubscriptionId: "sub_ramonage",
  currentPeriodEnd: PERIOD_END,
  isCancelScheduled: false,
  endedAt: null,
  paymentFailedAt: null,
  paymentMethod: { type: "card", last4: "4242" },
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...changes,
});

export const aStripeSubscription = (
  changes: Partial<StripeSubscriptionSnapshot> = {},
): StripeSubscriptionSnapshot => ({
  id: "sub_ramonage",
  customerId: "cus_ramonage",
  organizationId: ORGANIZATION_ID,
  status: "active",
  lookupKey: "team_monthly",
  currentPeriodEnd: PERIOD_END,
  isCancelScheduled: false,
  endedAt: null,
  paymentMethod: { type: "card", last4: "4242" },
  ...changes,
});
