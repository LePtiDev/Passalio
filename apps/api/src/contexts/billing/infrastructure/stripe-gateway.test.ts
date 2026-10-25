import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripeSubscriptionJson } from "./stripe-fixtures";
import { createStripeGateway, STRIPE_API_VERSION } from "./stripe-gateway";

type SentRequest = { readonly url: string; readonly init: RequestInit | undefined };

let sent: SentRequest[];
let reply: (url: string) => Response;

const gateway = (paymentMethodConfiguration: string | null = "pmc_passalio") =>
  createStripeGateway({ secretKey: "sk_test_passalio", paymentMethodConfiguration });

const formOf = (request: SentRequest | undefined) => {
  const body = request?.init?.body;
  return Object.fromEntries(new URLSearchParams(typeof body === "string" ? body : ""));
};

const headersOf = (request: SentRequest | undefined) => new Headers(request?.init?.headers);

beforeEach(() => {
  sent = [];
  reply = () => Response.json({ object: "list", data: [{ id: "price_team_monthly" }] });
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    sent.push({ url, init });
    return reply(url);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Stripe gateway", () => {
  it("authenticates with the secret key and pins the API version of docs/stripe.md", async () => {
    await gateway().findPriceId("team_monthly");
    expect(headersOf(sent[0]).get("authorization")).toBe("Bearer sk_test_passalio");
    expect(headersOf(sent[0]).get("stripe-version")).toBe(STRIPE_API_VERSION);
    expect(STRIPE_API_VERSION).toBe("2025-09-30.clover");
  });

  it("finds an active price by its lookup key", async () => {
    expect(await gateway().findPriceId("team_monthly")).toBe("price_team_monthly");
    const url = new URL(sent[0]?.url ?? "");
    expect(url.origin + url.pathname).toBe("https://api.stripe.com/v1/prices");
    expect(url.searchParams.get("lookup_keys[]")).toBe("team_monthly");
    expect(url.searchParams.get("active")).toBe("true");
  });

  it("creates a subscription Checkout tied to the company, in French, with card and SEPA", async () => {
    reply = () => Response.json({ id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" });
    const session = await gateway().createCheckoutSession({
      organizationId: "organization-a",
      priceId: "price_team_monthly",
      customerId: null,
      customerEmail: "patron@ramonage-martin.fr",
      successUrl: "https://app.passalio.com/reglages/abonnement?paiement=ok",
      cancelUrl: "https://app.passalio.com/reglages/abonnement",
    });
    expect(session).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_1" });
    expect(sent[0]?.url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(sent[0]?.init?.method).toBe("POST");
    expect(headersOf(sent[0]).get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(formOf(sent[0])).toEqual({
      mode: "subscription",
      "line_items[0][price]": "price_team_monthly",
      "line_items[0][quantity]": "1",
      client_reference_id: "organization-a",
      "metadata[organization_id]": "organization-a",
      "subscription_data[metadata][organization_id]": "organization-a",
      customer_email: "patron@ramonage-martin.fr",
      success_url: "https://app.passalio.com/reglages/abonnement?paiement=ok",
      cancel_url: "https://app.passalio.com/reglages/abonnement",
      payment_method_configuration: "pmc_passalio",
      locale: "fr",
    });
  });

  it("sends the existing customer instead of an email, and no configuration when none is set", async () => {
    reply = () => Response.json({ url: "https://checkout.stripe.com/c/pay/cs_2" });
    await gateway(null).createCheckoutSession({
      organizationId: "organization-a",
      priceId: "price_solo_monthly",
      customerId: "cus_Q1",
      customerEmail: null,
      successUrl: "https://app.passalio.com/a",
      cancelUrl: "https://app.passalio.com/b",
    });
    const form = formOf(sent[0]);
    expect(form.customer).toBe("cus_Q1");
    expect(form).not.toHaveProperty("customer_email");
    expect(form).not.toHaveProperty("payment_method_configuration");
  });

  it("opens a portal session for the customer", async () => {
    reply = () => Response.json({ url: "https://billing.stripe.com/p/session/1" });
    expect(
      await gateway().createPortalSession({
        customerId: "cus_Q1",
        returnUrl: "https://app.passalio.com/reglages/abonnement",
      }),
    ).toEqual({ url: "https://billing.stripe.com/p/session/1" });
    expect(sent[0]?.url).toBe("https://api.stripe.com/v1/billing_portal/sessions");
    expect(formOf(sent[0])).toEqual({
      customer: "cus_Q1",
      return_url: "https://app.passalio.com/reglages/abonnement",
      locale: "fr",
    });
  });

  it("reads a subscription with its payment method expanded", async () => {
    reply = () => Response.json(stripeSubscriptionJson());
    expect((await gateway().retrieveSubscription("sub_1Q"))?.paymentMethod).toEqual({
      type: "card",
      last4: "4242",
    });
    expect(sent[0]?.url).toBe(
      "https://api.stripe.com/v1/subscriptions/sub_1Q?expand[]=default_payment_method",
    );
  });

  it("knows no subscription that Stripe does not find", async () => {
    reply = () => Response.json({ error: { type: "invalid_request_error" } }, { status: 404 });
    expect(await gateway().retrieveSubscription("sub_inconnu")).toBeUndefined();
  });

  it.each([
    ["finding a price", () => gateway().findPriceId("team_monthly")],
    ["reading a subscription", () => gateway().retrieveSubscription("sub_1Q")],
    [
      "opening the portal",
      () => gateway().createPortalSession({ customerId: "cus_Q1", returnUrl: "https://a.fr" }),
    ],
  ])("fails loudly when Stripe refuses %s", async (_case, call) => {
    reply = () => Response.json({ error: { type: "api_error" } }, { status: 500 });
    await expect(call()).rejects.toThrow("stripe_request_failed:500");
  });
});
