import * as z from "zod";

export const PLANS = ["solo", "team"] as const;
export type Plan = (typeof PLANS)[number];

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const WORKSPACE_STATES = [
  "trial",
  "active",
  "payment_pending",
  "payment_failed",
  "blocked",
] as const;
export type WorkspaceState = (typeof WORKSPACE_STATES)[number];

export const BLOCKED_REASONS = ["trial_ended", "unpaid", "canceled"] as const;
export type BlockedReason = (typeof BLOCKED_REASONS)[number];

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const TRIAL_DAYS = 7;
export const PAYMENT_GRACE_DAYS = 15;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const addDays = (at: Date, days: number): Date => new Date(at.getTime() + days * DAY_IN_MS);

export const trialEndOf = (organizationCreatedAt: Date): Date =>
  addDays(organizationCreatedAt, TRIAL_DAYS);

export const paymentGraceEndOf = (paymentFailedAt: Date): Date =>
  addDays(paymentFailedAt, PAYMENT_GRACE_DAYS);

export const subscriptionDetailsResponse = z.object({
  plan: z.enum(PLANS),
  interval: z.enum(BILLING_INTERVALS),
  isFounder: z.boolean(),
  currentPeriodEndsAt: z.iso.datetime().nullable(),
  isCancelScheduled: z.boolean(),
  paymentMethod: z.object({ type: z.string(), last4: z.string().nullable() }).nullable(),
});
export type SubscriptionDetailsResponse = z.infer<typeof subscriptionDetailsResponse>;

export const subscriptionResponse = z.object({
  workspaceState: z.enum(WORKSPACE_STATES),
  blockedReason: z.enum(BLOCKED_REASONS).nullable(),
  trialEndsAt: z.iso.datetime(),
  graceEndsAt: z.iso.datetime().nullable(),
  isBillingEnabled: z.boolean(),
  canManage: z.boolean(),
  subscription: subscriptionDetailsResponse.nullable(),
});
export type SubscriptionResponse = z.infer<typeof subscriptionResponse>;

export const startCheckoutBody = z.object({
  plan: z.enum(PLANS),
  interval: z.enum(BILLING_INTERVALS),
});
export type StartCheckoutBody = z.infer<typeof startCheckoutBody>;

export const billingRedirectResponse = z.object({ url: z.url() });
export type BillingRedirectResponse = z.infer<typeof billingRedirectResponse>;
