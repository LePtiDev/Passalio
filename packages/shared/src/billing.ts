import * as z from "zod";
import { ORGANIZATION_ROLES, ROLE_PERMISSIONS } from "./roles";

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

export const TECHNICIAN_ROLES = ORGANIZATION_ROLES.filter((role) =>
  ROLE_PERMISSIONS[role].has("documents:sign"),
);

export const SOLO_TECHNICIAN_LIMIT = 1;

export const billingSeatsResponse = z.object({
  technicianCount: z.number().int().nonnegative(),
  ownerName: z.string().nullable(),
});
export type BillingSeatsResponse = z.infer<typeof billingSeatsResponse>;

export const INVOICE_STATUSES = ["open", "paid", "uncollectible", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoiceResponse = z.object({
  id: z.string(),
  number: z.string().nullable(),
  issuedAt: z.iso.datetime(),
  totalCents: z.number().int(),
  status: z.enum(INVOICE_STATUSES),
  pdfUrl: z.url().nullable(),
});
export type InvoiceResponse = z.infer<typeof invoiceResponse>;

export const invoicesResponse = z.object({ invoices: z.array(invoiceResponse) });

export const teamUpgradePreviewResponse = z.object({
  amountDueCents: z.number().int(),
  interval: z.enum(BILLING_INTERVALS),
  currentPeriodEndsAt: z.iso.datetime().nullable(),
  prorationDate: z.number().int().positive(),
});
export type TeamUpgradePreviewResponse = z.infer<typeof teamUpgradePreviewResponse>;

export const upgradeToTeamBody = z.object({ prorationDate: z.number().int().positive() });
export type UpgradeToTeamBody = z.infer<typeof upgradeToTeamBody>;
