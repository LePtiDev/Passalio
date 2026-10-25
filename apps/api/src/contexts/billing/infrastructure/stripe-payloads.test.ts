import { describe, expect, it } from "vitest";
import { stripeSubscriptionJson } from "./stripe-fixtures";
import {
  parseFirstPriceId,
  parseSessionUrl,
  parseStripeEvent,
  parseStripeSubscription,
} from "./stripe-payloads";

const eventJson = (type: string, object: Record<string, unknown>) =>
  JSON.stringify({ id: "evt_1", object: "event", type, created: 1, data: { object } });

describe("Stripe events", () => {
  it.each([
    ["customer.subscription.created", { id: "sub_1", object: "subscription" }],
    ["customer.subscription.deleted", { id: "sub_1", object: "subscription" }],
    [
      "checkout.session.completed",
      { id: "cs_1", object: "checkout.session", subscription: "sub_1" },
    ],
    [
      "checkout.session.async_payment_succeeded",
      { id: "cs_1", object: "checkout.session", subscription: { id: "sub_1" } },
    ],
    [
      "invoice.payment_failed",
      {
        id: "in_1",
        object: "invoice",
        parent: { subscription_details: { subscription: "sub_1" } },
      },
    ],
    ["invoice.paid", { id: "in_1", object: "invoice", subscription: "sub_1" }],
  ])("finds the subscription of %s", (type, object) => {
    expect(parseStripeEvent(eventJson(type, object))).toEqual({
      id: "evt_1",
      type,
      subscriptionId: "sub_1",
    });
  });

  it("finds no subscription in a one-off checkout or an unrelated event", () => {
    expect(
      parseStripeEvent(eventJson("checkout.session.completed", { id: "cs_1", subscription: null }))
        ?.subscriptionId,
    ).toBeNull();
    expect(
      parseStripeEvent(eventJson("customer.updated", { id: "cus_1", object: "customer" }))
        ?.subscriptionId,
    ).toBeNull();
  });

  it.each(["pas du json", "{}", '{"id":"evt_1","type":"invoice.paid"}'])(
    "refuses a body that is not a Stripe event: %s",
    (body) => {
      expect(parseStripeEvent(body)).toBeUndefined();
    },
  );
});

describe("Stripe subscriptions", () => {
  it("reads the company, the price, the period end and the card", () => {
    expect(parseStripeSubscription(stripeSubscriptionJson())).toEqual({
      id: "sub_1Q",
      customerId: "cus_Q1",
      organizationId: "organization-a",
      status: "active",
      lookupKey: "team_monthly",
      currentPeriodEnd: new Date(1_766_232_000 * 1000),
      isCancelScheduled: false,
      endedAt: null,
      paymentMethod: { type: "card", last4: "4242" },
    });
  });

  it("reads the last digits of a SEPA mandate", () => {
    expect(
      parseStripeSubscription(
        stripeSubscriptionJson({
          default_payment_method: { type: "sepa_debit", sepa_debit: { last4: "3000" } },
        }),
      ).paymentMethod,
    ).toEqual({ type: "sepa_debit", last4: "3000" });
  });

  it("knows no payment method when Stripe did not expand it", () => {
    expect(
      parseStripeSubscription(stripeSubscriptionJson({ default_payment_method: "pm_1" }))
        .paymentMethod,
    ).toBeNull();
  });

  it("sees a scheduled cancellation by its flag or by its date", () => {
    expect(
      parseStripeSubscription(stripeSubscriptionJson({ cancel_at_period_end: true }))
        .isCancelScheduled,
    ).toBe(true);
    expect(
      parseStripeSubscription(stripeSubscriptionJson({ cancel_at: 1_766_232_000 }))
        .isCancelScheduled,
    ).toBe(true);
  });

  it("reads the end date and the period end of an older API version", () => {
    const parsed = parseStripeSubscription(
      stripeSubscriptionJson({
        status: "canceled",
        ended_at: 1_766_232_000,
        current_period_end: 1_766_000_000,
        customer: { id: "cus_Q1" },
        metadata: {},
        items: { data: [{ price: { lookup_key: null } }] },
      }),
    );
    expect(parsed).toMatchObject({
      status: "canceled",
      customerId: "cus_Q1",
      organizationId: null,
      lookupKey: null,
      endedAt: new Date(1_766_232_000 * 1000),
      currentPeriodEnd: new Date(1_766_000_000 * 1000),
    });
  });

  it("refuses an unknown subscription status", () => {
    expect(() => parseStripeSubscription(stripeSubscriptionJson({ status: "frozen" }))).toThrow(
      /status/,
    );
  });
});

describe("Stripe prices and sessions", () => {
  it("reads the first price found by lookup key, or none", () => {
    expect(parseFirstPriceId({ object: "list", data: [{ id: "price_1" }] })).toBe("price_1");
    expect(parseFirstPriceId({ object: "list", data: [] })).toBeUndefined();
  });

  it("reads the url of a Checkout or portal session", () => {
    expect(parseSessionUrl({ id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" })).toBe(
      "https://checkout.stripe.com/c/pay/cs_1",
    );
  });
});
