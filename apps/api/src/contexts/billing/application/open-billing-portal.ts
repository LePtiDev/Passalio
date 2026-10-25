import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { PortalError } from "../domain/billing-error";
import type { BillingDependencies } from "../domain/billing-ports";
import { BILLING_SETTINGS_PATH } from "../domain/subscription-rules";

export const openBillingPortal =
  ({ workspaces, stripe, appUrl }: BillingDependencies) =>
  async (actor: Actor): Promise<Result<{ readonly url: string }, PortalError>> => {
    assertCan(actor, "billing:manage");
    if (stripe === null) {
      return err("billing_unavailable");
    }
    const subscription = (await workspaces.findWorkspace(actor.organizationId))?.subscription;
    if (subscription === null || subscription === undefined) {
      return err("no_subscription");
    }
    return ok(
      await stripe.createPortalSession({
        customerId: subscription.stripeCustomerId,
        returnUrl: `${appUrl}${BILLING_SETTINGS_PATH}`,
      }),
    );
  };
