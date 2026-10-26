import {
  assertCan,
  err,
  ok,
  type Actor,
  type Result,
  type TeamUpgradePreviewResponse,
} from "@passalio/shared";
import type { TeamUpgradeError } from "../domain/billing-error";
import type { BillingDependencies } from "../domain/billing-ports";
import { unixSecondsOf } from "../domain/proration";
import { findTeamUpgradeTarget } from "./find-team-upgrade-target";

export const previewTeamUpgrade =
  (dependencies: BillingDependencies) =>
  async (actor: Actor): Promise<Result<TeamUpgradePreviewResponse, TeamUpgradeError>> => {
    assertCan(actor, "billing:manage");
    const target = await findTeamUpgradeTarget(dependencies)(actor.organizationId);
    if (!target.isOk) {
      return err(target.error);
    }
    const { subscription, priceId, stripe } = target.value;
    const at = dependencies.now();
    const { amountDueCents } = await stripe.previewPriceChange({
      subscriptionId: subscription.stripeSubscriptionId,
      priceId,
      proration: { kind: "invoice_now", at },
    });
    return ok({
      amountDueCents,
      interval: subscription.interval,
      currentPeriodEndsAt: subscription.currentPeriodEnd?.toISOString() ?? null,
      prorationDate: unixSecondsOf(at),
    });
  };
