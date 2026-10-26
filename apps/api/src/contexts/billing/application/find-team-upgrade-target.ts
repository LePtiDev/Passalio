import { err, ok, type Result } from "@passalio/shared";
import type { TeamUpgradeError } from "../domain/billing-error";
import type { Subscription } from "../domain/billing-models";
import type { BillingDependencies, StripeGateway } from "../domain/billing-ports";
import { lookupKeyOf } from "../domain/plan-catalog";
import { hasLiveSubscription } from "../domain/subscription-rules";
import { isLimitedToSolo } from "../domain/technician-seats";

export type TeamUpgradeTarget = {
  readonly subscription: Subscription;
  readonly priceId: string;
  readonly stripe: StripeGateway;
};

export const findTeamUpgradeTarget =
  ({ workspaces, stripe }: BillingDependencies) =>
  async (organizationId: string): Promise<Result<TeamUpgradeTarget, TeamUpgradeError>> => {
    if (stripe === null) {
      return err("billing_unavailable");
    }
    const subscription = (await workspaces.findWorkspace(organizationId))?.subscription ?? null;
    if (subscription === null || !hasLiveSubscription(subscription)) {
      return err("no_subscription");
    }
    if (!isLimitedToSolo(subscription)) {
      return err("not_on_solo");
    }
    const priceId = await stripe.findPriceId(lookupKeyOf("team", subscription.interval));
    return priceId === undefined ? err("price_not_found") : ok({ subscription, priceId, stripe });
  };
