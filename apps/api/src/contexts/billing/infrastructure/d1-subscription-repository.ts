import { subscriptions } from "@passalio/db";
import type { Database } from "../../../platform/database";
import type { Subscription } from "../domain/billing-models";
import type { SubscriptionRepository } from "../domain/billing-ports";

const changesOf = (subscription: Subscription) => ({
  plan: subscription.plan,
  interval: subscription.interval,
  isFounder: subscription.isFounder,
  status: subscription.status,
  stripeCustomerId: subscription.stripeCustomerId,
  stripeSubscriptionId: subscription.stripeSubscriptionId,
  currentPeriodEnd: subscription.currentPeriodEnd,
  isCancelScheduled: subscription.isCancelScheduled,
  endedAt: subscription.endedAt,
  paymentFailedAt: subscription.paymentFailedAt,
  paymentMethodType: subscription.paymentMethod?.type ?? null,
  paymentMethodLast4: subscription.paymentMethod?.last4 ?? null,
  updatedAt: subscription.updatedAt,
});

export const createD1SubscriptionRepository = (database: Database): SubscriptionRepository => ({
  save: async (subscription) => {
    const changes = changesOf(subscription);
    await database
      .insert(subscriptions)
      .values({
        ...changes,
        id: subscription.id,
        organizationId: subscription.organizationId,
        createdAt: subscription.createdAt,
      })
      .onConflictDoUpdate({ target: subscriptions.organizationId, set: changes });
  },
});
