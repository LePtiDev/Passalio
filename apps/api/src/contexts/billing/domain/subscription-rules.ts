import type { SubscriptionStatus } from "@passalio/shared";
import type { Subscription } from "./billing-models";

const ENDED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["canceled", "incomplete_expired"]);

export const hasLiveSubscription = (subscription: Subscription | null): boolean =>
  subscription !== null && !ENDED_STATUSES.has(subscription.status);

export const BILLING_SETTINGS_PATH = "/reglages/abonnement";

const PAYMENT_FAILED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["past_due", "unpaid"]);

export const paymentFailedAtOf = (
  status: SubscriptionStatus,
  previousFailure: Date | null,
  at: Date,
): Date | null => (PAYMENT_FAILED_STATUSES.has(status) ? (previousFailure ?? at) : null);

export const isOutdatedSubscription = (
  current: Subscription | null,
  incomingSubscriptionId: string,
  isIncomingEnded: boolean,
): boolean =>
  current !== null &&
  current.stripeSubscriptionId !== incomingSubscriptionId &&
  hasLiveSubscription(current) &&
  isIncomingEnded;

export const isEndedStatus = (status: SubscriptionStatus): boolean => ENDED_STATUSES.has(status);
