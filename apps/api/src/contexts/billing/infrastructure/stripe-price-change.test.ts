import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripeSubscriptionJson } from "./stripe-fixtures";
import { createStripeGateway } from "./stripe-gateway";

const AT = new Date("2026-11-20T12:00:00.000Z");
const AT_SECONDS = String(AT.getTime() / 1000);

type SentRequest = {
  readonly method: string;
  readonly path: string;
  readonly form: URLSearchParams;
};

const gateway = () =>
  createStripeGateway({ secretKey: "sk_test_passalio", paymentMethodConfiguration: null });

const subscriptionWithItem = () => ({
  ...stripeSubscriptionJson(),
  items: {
    data: [
      { id: "si_solo", current_period_end: 1_798_761_600, price: { lookup_key: "team_monthly" } },
    ],
  },
});

let sent: SentRequest[];
let updateStatus: number;

beforeEach(() => {
  sent = [];
  updateStatus = 200;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method ?? "GET";
    sent.push({
      method,
      path: url.pathname,
      form: new URLSearchParams(typeof init?.body === "string" ? init.body : ""),
    });
    if (url.pathname === "/v1/invoices/create_preview") {
      return Response.json({ object: "invoice", amount_due: 1000 });
    }
    if (method === "POST") {
      return Response.json(
        updateStatus === 200 ? subscriptionWithItem() : { error: { type: "card_error" } },
        { status: updateStatus },
      );
    }
    return Response.json(subscriptionWithItem());
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const change = (proration: { kind: "invoice_now"; at: Date } | { kind: "next_invoice" }) => ({
  subscriptionId: "sub_Q1",
  priceId: "price_team",
  proration,
});

describe("Stripe gateway, Équipe prorata preview", () => {
  it("previews the invoice of today for the new price on the current item", async () => {
    expect(await gateway().previewPriceChange(change({ kind: "invoice_now", at: AT }))).toEqual({
      amountDueCents: 1000,
    });
    expect(sent.map(({ method, path }) => `${method} ${path}`)).toEqual([
      "GET /v1/subscriptions/sub_Q1",
      "POST /v1/invoices/create_preview",
    ]);
    expect(Object.fromEntries(sent[1]?.form ?? [])).toEqual({
      subscription: "sub_Q1",
      "subscription_details[items][0][id]": "si_solo",
      "subscription_details[items][0][price]": "price_team",
      "subscription_details[proration_behavior]": "always_invoice",
      "subscription_details[proration_date]": AT_SECONDS,
    });
  });
});

describe("Stripe gateway, price change", () => {
  it("charges the prorata now and fails rather than leave an unpaid invoice", async () => {
    expect((await gateway().changePrice(change({ kind: "invoice_now", at: AT })))?.lookupKey).toBe(
      "team_monthly",
    );
    expect(sent.at(-1)?.path).toBe("/v1/subscriptions/sub_Q1");
    expect(Object.fromEntries(sent.at(-1)?.form ?? [])).toEqual({
      "items[0][id]": "si_solo",
      "items[0][price]": "price_team",
      proration_behavior: "always_invoice",
      proration_date: AT_SECONDS,
      payment_behavior: "error_if_incomplete",
      "expand[]": "default_payment_method",
    });
  });

  it("puts a price back with the prorata on the next invoice", async () => {
    await gateway().changePrice(change({ kind: "next_invoice" }));
    expect(Object.fromEntries(sent.at(-1)?.form ?? [])).toEqual({
      "items[0][id]": "si_solo",
      "items[0][price]": "price_team",
      proration_behavior: "create_prorations",
      "expand[]": "default_payment_method",
    });
  });

  it("answers nothing when the card is refused", async () => {
    updateStatus = 402;
    expect(await gateway().changePrice(change({ kind: "invoice_now", at: AT }))).toBeUndefined();
  });

  it("throws on another Stripe error", async () => {
    updateStatus = 500;
    await expect(gateway().changePrice(change({ kind: "invoice_now", at: AT }))).rejects.toThrow(
      "stripe_request_failed:500",
    );
  });
});
