import { newId } from "@passalio/shared";
import type { StripeSubscriptionSnapshot, Subscription } from "./billing-models";
import { pricedPlanOf } from "./plan-catalog";
import { paymentFailedAtOf } from "./subscription-rules";

export const subscriptionFrom = (
  snapshot: StripeSubscriptionSnapshot,
  organizationId: string,
  current: Subscription | null,
  at: Date,
): Subscription | undefined => {
  const pricedPlan = pricedPlanOf(snapshot.lookupKey);
  if (pricedPlan === undefined) {
    return undefined;
  }
  const sameSubscription = current?.stripeSubscriptionId === snapshot.id ? current : null;
  return {
    id: current?.id ?? newId(),
    organizationId,
    ...pricedPlan,
    status: snapshot.status,
    stripeCustomerId: snapshot.customerId,
    stripeSubscriptionId: snapshot.id,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    isCancelScheduled: snapshot.isCancelScheduled,
    endedAt: snapshot.endedAt,
    paymentFailedAt: paymentFailedAtOf(
      snapshot.status,
      sameSubscription?.paymentFailedAt ?? null,
      at,
    ),
    paymentMethod: snapshot.paymentMethod,
    createdAt: current?.createdAt ?? at,
    updatedAt: at,
  };
};
