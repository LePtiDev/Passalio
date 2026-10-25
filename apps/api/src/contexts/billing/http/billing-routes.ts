import { startCheckoutBody } from "@passalio/shared";
import { Hono } from "hono";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson } from "../../../platform/validation";
import { getBillingSeats } from "../application/get-billing-seats";
import { getSubscription } from "../application/get-subscription";
import { listInvoices } from "../application/list-invoices";
import { openBillingPortal } from "../application/open-billing-portal";
import { startCheckout } from "../application/start-checkout";
import type { CheckoutError, PortalError } from "../domain/billing-error";
import { billingDependencies } from "./billing-context";

const STATUS_OF_ERROR = {
  billing_unavailable: 503,
  price_not_found: 503,
  already_subscribed: 409,
  no_subscription: 404,
} as const satisfies Record<CheckoutError | PortalError, number>;

export const billingRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .get("/subscription", async (context) => {
    const subscription = await getSubscription(billingDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return subscription === undefined
      ? context.json({ error: "organization_not_found", traceId: context.get("traceId") }, 404)
      : context.json({ subscription });
  })
  .post("/checkout", validateJson(startCheckoutBody), async (context) => {
    const result = await startCheckout(billingDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.json(result.value)
      : context.json(
          { error: result.error, traceId: context.get("traceId") },
          STATUS_OF_ERROR[result.error],
        );
  })
  .post("/portal", async (context) => {
    const result = await openBillingPortal(billingDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return result.isOk
      ? context.json(result.value)
      : context.json(
          { error: result.error, traceId: context.get("traceId") },
          STATUS_OF_ERROR[result.error],
        );
  })
  .get("/seats", async (context) =>
    context.json({
      seats: await getBillingSeats(billingDependencies(context.var, context.env))(
        context.get("actor"),
      ),
    }),
  )
  .get("/invoices", async (context) =>
    context.json({
      invoices: await listInvoices(billingDependencies(context.var, context.env))(
        context.get("actor"),
      ),
    }),
  );
