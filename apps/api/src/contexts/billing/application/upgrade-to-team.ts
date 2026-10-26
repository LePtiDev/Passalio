import {
  assertCan,
  err,
  ok,
  type Actor,
  type Result,
  type UpgradeToTeamBody,
} from "@passalio/shared";
import type { TeamUpgradeError } from "../domain/billing-error";
import type { BillingDependencies } from "../domain/billing-ports";
import { dateOfUnixSeconds, isFreshProrationDate } from "../domain/proration";
import { subscriptionFrom } from "../domain/subscription-from-snapshot";
import { findTeamUpgradeTarget } from "./find-team-upgrade-target";

export const upgradeToTeam =
  (dependencies: BillingDependencies) =>
  async (
    actor: Actor,
    { prorationDate }: UpgradeToTeamBody,
  ): Promise<Result<void, TeamUpgradeError>> => {
    assertCan(actor, "billing:manage");
    const { subscriptions, auditTrail, now } = dependencies;
    const target = await findTeamUpgradeTarget(dependencies)(actor.organizationId);
    if (!target.isOk) {
      return err(target.error);
    }
    if (!isFreshProrationDate(prorationDate, now())) {
      return err("preview_expired");
    }
    const { subscription, priceId, stripe } = target.value;
    const snapshot = await stripe.changePrice({
      subscriptionId: subscription.stripeSubscriptionId,
      priceId,
      proration: { kind: "invoice_now", at: dateOfUnixSeconds(prorationDate) },
    });
    if (snapshot === undefined) {
      return err("payment_failed");
    }
    const next = subscriptionFrom(snapshot, actor.organizationId, subscription, now());
    if (next !== undefined) {
      await subscriptions.save(next);
    }
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "billing.plan_upgraded",
      data: { from: "solo", to: "team", interval: subscription.interval },
    });
    return ok(undefined);
  };
