import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { handleStripeEvent } from "../application/handle-stripe-event";
import { isValidStripeSignature } from "../infrastructure/stripe-signature";
import { parseStripeEvent } from "../infrastructure/stripe-payloads";
import { billingDependencies } from "./billing-context";

export const stripeWebhookRoutes = new Hono<AppEnv>().post("/", async (context) => {
  const traceId = context.get("traceId");
  const secret = context.env.STRIPE_WEBHOOK_SECRET ?? "";
  const dependencies = billingDependencies(context.var, context.env);
  if (secret === "" || dependencies.stripe === null) {
    return context.json({ error: "billing_unavailable", traceId }, 503);
  }
  const payload = await context.req.text();
  const isSigned = await isValidStripeSignature({
    payload,
    header: context.req.header("stripe-signature"),
    secret,
    now: dependencies.now(),
  });
  if (!isSigned) {
    context.get("logger").warn({ event: "stripe_webhook_signature_refused" });
    return context.json({ error: "invalid_signature", traceId }, 400);
  }
  const event = parseStripeEvent(payload);
  if (event === undefined) {
    return context.json({ error: "invalid_request", traceId }, 400);
  }
  const outcome = await handleStripeEvent(dependencies)(event);
  context.get("logger").info({
    event: "stripe_webhook_handled",
    stripeEventId: event.id,
    stripeEventType: event.type,
    outcome,
  });
  return context.json({ received: true });
});
