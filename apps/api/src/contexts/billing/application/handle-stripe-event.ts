import { newId } from "@passalio/shared";
import type { StripeEventOutcome } from "../domain/billing-error";
import type {
  StripeEvent,
  StripeSubscriptionSnapshot,
  Subscription,
} from "../domain/billing-models";
import type { BillingDependencies, StripeGateway } from "../domain/billing-ports";
import { pricedPlanOf } from "../domain/plan-catalog";
import {
  isEndedStatus,
  isOutdatedSubscription,
  paymentFailedAtOf,
} from "../domain/subscription-rules";

const hasChanged = (previous: Subscription | null, next: Subscription) =>
  previous === null ||
  previous.status !== next.status ||
  previous.plan !== next.plan ||
  previous.interval !== next.interval ||
  previous.isCancelScheduled !== next.isCancelScheduled;

const subscriptionFrom = (
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

const synchronizeSubscription =
  ({ workspaces, subscriptions, auditTrail, now }: BillingDependencies, stripe: StripeGateway) =>
  async (subscriptionId: string): Promise<StripeEventOutcome> => {
    const snapshot = await stripe.retrieveSubscription(subscriptionId);
    if (snapshot === undefined || snapshot.organizationId === null) {
      return "ignored";
    }
    const workspace = await workspaces.findWorkspace(snapshot.organizationId);
    if (workspace === undefined) {
      return "ignored";
    }
    const current = workspace.subscription;
    if (isOutdatedSubscription(current, snapshot.id, isEndedStatus(snapshot.status))) {
      return "ignored";
    }
    const next = subscriptionFrom(snapshot, workspace.organizationId, current, now());
    if (next === undefined) {
      return "ignored";
    }
    await subscriptions.save(next);
    if (hasChanged(current, next)) {
      await auditTrail.record({
        organizationId: next.organizationId,
        actorUserId: null,
        action: "billing.subscription_updated",
        data: { status: next.status, plan: next.plan, interval: next.interval },
      });
    }
    return "processed";
  };

export const handleStripeEvent =
  (dependencies: BillingDependencies) =>
  async (event: StripeEvent): Promise<StripeEventOutcome> => {
    const { stripe, stripeEvents, now } = dependencies;
    if (stripe === null) {
      return "ignored";
    }
    if (await stripeEvents.hasProcessed(event.id)) {
      return "duplicate";
    }
    const outcome =
      event.subscriptionId === null
        ? "ignored"
        : await synchronizeSubscription(dependencies, stripe)(event.subscriptionId);
    await stripeEvents.markProcessed(event, now());
    return outcome;
  };
