import {
  assertCan,
  err,
  ok,
  type Actor,
  type Result,
  type StartCheckoutBody,
} from "@passalio/shared";
import type { CheckoutError } from "../domain/billing-error";
import type { BillingDependencies } from "../domain/billing-ports";
import { lookupKeyOf } from "../domain/plan-catalog";
import { BILLING_SETTINGS_PATH, hasLiveSubscription } from "../domain/subscription-rules";

export const startCheckout =
  ({ workspaces, contacts, stripe, auditTrail, appUrl }: BillingDependencies) =>
  async (
    actor: Actor,
    { plan, interval }: StartCheckoutBody,
  ): Promise<Result<{ readonly url: string }, CheckoutError>> => {
    assertCan(actor, "billing:manage");
    if (stripe === null) {
      return err("billing_unavailable");
    }
    const workspace = await workspaces.findWorkspace(actor.organizationId);
    const subscription = workspace?.subscription ?? null;
    if (hasLiveSubscription(subscription)) {
      return err("already_subscribed");
    }
    const priceId = await stripe.findPriceId(lookupKeyOf(plan, interval));
    if (priceId === undefined) {
      return err("price_not_found");
    }
    const customerId = subscription?.stripeCustomerId ?? null;
    const customerEmail =
      customerId === null ? ((await contacts.findEmail(actor.userId)) ?? null) : null;
    const session = await stripe.createCheckoutSession({
      organizationId: actor.organizationId,
      priceId,
      customerId,
      customerEmail,
      successUrl: `${appUrl}${BILLING_SETTINGS_PATH}?paiement=ok`,
      cancelUrl: `${appUrl}${BILLING_SETTINGS_PATH}`,
    });
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "billing.checkout_started",
      data: { plan, interval },
    });
    return ok({ url: session.url });
  };
