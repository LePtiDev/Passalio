import type { Subscription } from "../domain/billing-models";
import type { BillingDependencies, StripeGateway } from "../domain/billing-ports";
import { lookupKeyOfPricedPlan } from "../domain/plan-catalog";
import { subscriptionFrom } from "../domain/subscription-from-snapshot";
import { exceedsSoloSeats, isLimitedToSolo } from "../domain/technician-seats";
import { countUsedTechnicianSeats } from "./has-technician-seat";

const isDowngradeToSolo = (current: Subscription | null, next: Subscription) =>
  current !== null &&
  current.plan === "team" &&
  current.stripeSubscriptionId === next.stripeSubscriptionId &&
  isLimitedToSolo(next);

export const revertSoloDowngrade =
  ({ contacts, auditTrail, now }: BillingDependencies, stripe: StripeGateway) =>
  async (current: Subscription | null, next: Subscription): Promise<Subscription> => {
    if (current === null || !isDowngradeToSolo(current, next)) {
      return next;
    }
    const usedSeats = await countUsedTechnicianSeats(contacts)(next.organizationId);
    if (!exceedsSoloSeats(usedSeats)) {
      return next;
    }
    const priceId = await stripe.findPriceId(lookupKeyOfPricedPlan(current));
    if (priceId === undefined) {
      throw new Error("team_price_not_found");
    }
    const snapshot = await stripe.changePrice({
      subscriptionId: next.stripeSubscriptionId,
      priceId,
      proration: { kind: "next_invoice" },
    });
    const reverted =
      snapshot === undefined
        ? undefined
        : subscriptionFrom(snapshot, next.organizationId, current, now());
    if (reverted === undefined) {
      throw new Error("solo_downgrade_not_reverted");
    }
    await auditTrail.record({
      organizationId: next.organizationId,
      actorUserId: null,
      action: "billing.downgrade_reverted",
      data: { technicianSeats: String(usedSeats) },
    });
    return reverted;
  };
