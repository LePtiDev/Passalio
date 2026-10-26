import { signStripePayload } from "../src/contexts/billing/infrastructure/stripe-signature";
import type { ExternalService } from "./test-platform";

export const STRIPE_TEST_BINDINGS = {
  STRIPE_SECRET_KEY: "sk_test_routes",
  STRIPE_WEBHOOK_SECRET: "whsec_routes",
  STRIPE_PAYMENT_METHOD_CONFIGURATION: "pmc_routes",
} as const;

export type StripeCall = {
  readonly method: string;
  readonly path: string;
  readonly form: Readonly<Record<string, string>>;
};

const SUBSCRIPTION_PATH = /^\/v1\/subscriptions\/([^/]+)$/;

const subscriptionItem = {
  id: "si_routes",
  current_period_end: 1_798_761_600,
  price: { lookup_key: "team_monthly" },
};

export const itemsWithPrice = (lookupKey: string) => ({
  data: [{ ...subscriptionItem, price: { lookup_key: lookupKey } }],
});

export const createFakeStripe = () => {
  const subscriptions = new Map<string, Record<string, unknown>>();
  const invoices = new Map<string, Record<string, unknown>[]>();
  const previewAmounts = new Map<string, number>();
  const refusedPayments = new Set<string>();
  const calls: StripeCall[] = [];

  const changePrice = (subscriptionId: string, form: URLSearchParams): Response => {
    const subscription = subscriptions.get(subscriptionId);
    if (subscription === undefined) {
      return Response.json({ error: { type: "invalid_request_error" } }, { status: 404 });
    }
    if (form.get("payment_behavior") !== null && refusedPayments.has(subscriptionId)) {
      return Response.json({ error: { type: "card_error" } }, { status: 402 });
    }
    const lookupKey = (form.get("items[0][price]") ?? "").replace(/^price_/, "");
    const changed = { ...subscription, items: itemsWithPrice(lookupKey) };
    subscriptions.set(subscriptionId, changed);
    return Response.json(changed);
  };

  const answer = (method: string, url: URL, form: URLSearchParams): Response => {
    if (url.pathname === "/v1/prices") {
      return Response.json({ data: [{ id: `price_${url.searchParams.get("lookup_keys[]")}` }] });
    }
    if (url.pathname === "/v1/checkout/sessions" && method === "POST") {
      return Response.json({ url: `https://checkout.stripe.com/c/pay/cs_test_${calls.length}` });
    }
    if (url.pathname === "/v1/invoices") {
      return Response.json({ data: invoices.get(url.searchParams.get("customer") ?? "") ?? [] });
    }
    if (url.pathname === "/v1/billing_portal/sessions" && method === "POST") {
      return Response.json({ url: `https://billing.stripe.com/p/session/test_${calls.length}` });
    }
    if (url.pathname === "/v1/invoices/create_preview" && method === "POST") {
      return Response.json({
        object: "invoice",
        amount_due: previewAmounts.get(form.get("subscription") ?? "") ?? 0,
      });
    }
    const subscriptionId = SUBSCRIPTION_PATH.exec(url.pathname)?.[1];
    if (subscriptionId !== undefined && method === "POST") {
      return changePrice(subscriptionId, form);
    }
    const subscription =
      subscriptionId === undefined ? undefined : subscriptions.get(subscriptionId);
    return subscription === undefined
      ? Response.json({ error: { type: "invalid_request_error" } }, { status: 404 })
      : Response.json(subscription);
  };

  const service: ExternalService = (url, init) => {
    if (!url.startsWith("https://api.stripe.com/")) {
      return undefined;
    }
    const parsed = new URL(url);
    const method = init?.method ?? "GET";
    const form = new URLSearchParams(typeof init?.body === "string" ? init.body : "");
    calls.push({ method, path: parsed.pathname, form: Object.fromEntries(form) });
    return Promise.resolve(answer(method, parsed, form));
  };

  return { service, subscriptions, invoices, previewAmounts, refusedPayments, calls };
};

export type FakeStripe = ReturnType<typeof createFakeStripe>;

export const stripeSubscription = (
  organizationId: string,
  changes: Record<string, unknown> = {},
) => ({
  id: `sub_${organizationId}`,
  object: "subscription",
  customer: `cus_${organizationId}`,
  status: "active",
  metadata: { organization_id: organizationId },
  cancel_at_period_end: false,
  cancel_at: null,
  ended_at: null,
  default_payment_method: { type: "card", card: { last4: "4242" } },
  items: {
    data: [subscriptionItem],
  },
  ...changes,
});

export const signedStripeEvent = async (
  event: { readonly id: string; readonly type: string; readonly object: Record<string, unknown> },
  secret: string = STRIPE_TEST_BINDINGS.STRIPE_WEBHOOK_SECRET,
): Promise<RequestInit> => {
  const payload = JSON.stringify({
    id: event.id,
    object: "event",
    type: event.type,
    data: { object: event.object },
  });
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    method: "POST",
    body: payload,
    headers: {
      "stripe-signature": `t=${timestamp},v1=${await signStripePayload(payload, secret, timestamp)}`,
    },
  };
};
