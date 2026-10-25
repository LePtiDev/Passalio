import {
  PAYMENT_GRACE_DAYS,
  SOLO_TECHNICIAN_LIMIT,
  TRIAL_DAYS,
  type BillingInterval,
  type InvoiceStatus,
  type Plan,
  type SubscriptionDetailsResponse,
  type SubscriptionResponse,
  type WorkspaceState,
} from "@passalio/shared";
import { daysUntil } from "@/lib/format-date";

export const PLAN_PRICES_EUROS: Readonly<Record<Plan, Readonly<Record<BillingInterval, number>>>> =
  {
    solo: { month: 29, year: 290 },
    team: { month: 49, year: 490 },
  };

export const FOUNDER_MONTHLY_PRICE_EUROS = 19;

export const BANNER_TRIAL_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export const subscriptionPriceOf = ({
  plan,
  interval,
  isFounder,
}: Pick<SubscriptionDetailsResponse, "plan" | "interval" | "isFounder">): number =>
  isFounder ? FOUNDER_MONTHLY_PRICE_EUROS : PLAN_PRICES_EUROS[plan][interval];

export type TrialProgress = {
  readonly daysLeft: number;
  readonly daysUsed: number;
};

export const trialProgressOf = (trialEndsAt: Date, now: Date): TrialProgress => {
  const daysLeft = Math.min(TRIAL_DAYS, Math.max(0, daysUntil(trialEndsAt, now)));
  return { daysLeft, daysUsed: TRIAL_DAYS - daysLeft };
};

export const recommendedPlanOf = (technicianCount: number): Plan =>
  technicianCount <= SOLO_TECHNICIAN_LIMIT ? "solo" : "team";

export type SubscriptionAlert =
  | "member"
  | "payment_pending"
  | "payment_failed"
  | "cancel_scheduled";

export const subscriptionAlertOf = (
  response: Pick<SubscriptionResponse, "canManage" | "workspaceState" | "subscription">,
): SubscriptionAlert | null => {
  if (!response.canManage) {
    return "member";
  }
  if (
    response.workspaceState === "payment_pending" ||
    response.workspaceState === "payment_failed"
  ) {
    return response.workspaceState;
  }
  return response.subscription?.isCancelScheduled === true ? "cancel_scheduled" : null;
};

export type SubscriptionBadge = "active" | "payment_pending" | "payment_failed" | "ending";

export const subscriptionBadgeOf = (
  workspaceState: WorkspaceState,
  isCancelScheduled: boolean,
): SubscriptionBadge => {
  if (workspaceState === "payment_pending" || workspaceState === "payment_failed") {
    return workspaceState;
  }
  return isCancelScheduled ? "ending" : "active";
};

export type BillingBanner =
  | { readonly kind: "trial_ending"; readonly daysLeft: number }
  | { readonly kind: "payment_failed"; readonly graceEndsAt: Date };

export const billingBannerOf = (
  response: SubscriptionResponse,
  now: Date,
): BillingBanner | null => {
  if (!response.isBillingEnabled || !response.canManage) {
    return null;
  }
  if (response.workspaceState === "payment_failed" && response.graceEndsAt !== null) {
    return { kind: "payment_failed", graceEndsAt: new Date(response.graceEndsAt) };
  }
  if (response.workspaceState !== "trial") {
    return null;
  }
  const { daysLeft } = trialProgressOf(new Date(response.trialEndsAt), now);
  return daysLeft <= BANNER_TRIAL_DAYS ? { kind: "trial_ending", daysLeft } : null;
};

export const isWorkspaceBlocked = (
  response: Pick<SubscriptionResponse, "isBillingEnabled" | "workspaceState">,
): boolean => response.isBillingEnabled && response.workspaceState === "blocked";

export const paymentFailedAtOf = (graceEndsAt: Date): Date =>
  new Date(graceEndsAt.getTime() - PAYMENT_GRACE_DAYS * DAY_MS);

export type InvoiceState = "paid" | "processing" | "unpaid" | "due" | "void";

export const invoiceStateOf = (
  status: InvoiceStatus,
  workspaceState: WorkspaceState,
): InvoiceState => {
  if (status === "open") {
    if (workspaceState === "payment_pending") {
      return "processing";
    }
    return workspaceState === "payment_failed" ? "unpaid" : "due";
  }
  if (status === "uncollectible") {
    return "unpaid";
  }
  return status;
};

const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export const formatEuros = (amount: number): string => EUROS.format(amount);

export const formatCents = (cents: number): string => formatEuros(cents / 100);
