import { assertCan, can, type Actor, type SubscriptionResponse } from "@passalio/shared";
import type { Subscription } from "../domain/billing-models";
import type { BillingDependencies } from "../domain/billing-ports";
import { workspaceAccessOf } from "../domain/workspace-access";

const subscriptionDetailsOf = (subscription: Subscription, canManage: boolean) => ({
  plan: subscription.plan,
  interval: subscription.interval,
  isFounder: subscription.isFounder,
  currentPeriodEndsAt: subscription.currentPeriodEnd?.toISOString() ?? null,
  isCancelScheduled: subscription.isCancelScheduled,
  paymentMethod: canManage ? subscription.paymentMethod : null,
});

export const getSubscription =
  ({ workspaces, stripe, now }: BillingDependencies) =>
  async (actor: Actor): Promise<SubscriptionResponse | undefined> => {
    assertCan(actor, "organization:read");
    const workspace = await workspaces.findWorkspace(actor.organizationId);
    if (workspace === undefined) {
      return undefined;
    }
    const access = workspaceAccessOf({ ...workspace, now: now() });
    const canManage = can(actor, "billing:manage");
    return {
      workspaceState: access.state,
      blockedReason: access.blockedReason,
      trialEndsAt: access.trialEndsAt.toISOString(),
      graceEndsAt: access.graceEndsAt?.toISOString() ?? null,
      isBillingEnabled: stripe !== null,
      canManage,
      subscription:
        workspace.subscription === null
          ? null
          : subscriptionDetailsOf(workspace.subscription, canManage),
    };
  };
