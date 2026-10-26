import type { StripeEventOutcome } from "../domain/billing-error";
import type { StripeEvent, Subscription } from "../domain/billing-models";
import type { BillingDependencies, StripeGateway } from "../domain/billing-ports";
import { subscriptionFrom } from "../domain/subscription-from-snapshot";
import { revertSoloDowngrade } from "./revert-solo-downgrade";
import { isEndedStatus, isOutdatedSubscription } from "../domain/subscription-rules";

const hasChanged = (previous: Subscription | null, next: Subscription) =>
  previous === null ||
  previous.status !== next.status ||
  previous.plan !== next.plan ||
  previous.interval !== next.interval ||
  previous.isCancelScheduled !== next.isCancelScheduled;

const synchronizeSubscription =
  (dependencies: BillingDependencies, stripe: StripeGateway) =>
  async (subscriptionId: string): Promise<StripeEventOutcome> => {
    const { workspaces, subscriptions, auditTrail, now } = dependencies;
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
    const incoming = subscriptionFrom(snapshot, workspace.organizationId, current, now());
    if (incoming === undefined) {
      return "ignored";
    }
    const next = await revertSoloDowngrade(dependencies, stripe)(current, incoming);
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
