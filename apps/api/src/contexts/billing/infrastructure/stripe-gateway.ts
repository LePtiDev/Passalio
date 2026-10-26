import type { CheckoutRequest, PriceChange, Proration } from "../domain/billing-models";
import type { StripeGateway } from "../domain/billing-ports";
import { unixSecondsOf } from "../domain/proration";
import {
  parseAmountDue,
  parseFirstItemId,
  parseFirstPriceId,
  parseInvoices,
  parseSessionUrl,
  parseStripeSubscription,
} from "./stripe-payloads";

export const INVOICE_PAGE_SIZE = 12;

const STRIPE_API = "https://api.stripe.com/v1";
export const STRIPE_API_VERSION = "2025-09-30.clover";

type FormFields = Readonly<Record<string, string | null>>;

const formOf = (fields: FormFields) =>
  new URLSearchParams(
    Object.entries(fields).flatMap(([key, value]) => (value === null ? [] : [[key, value]])),
  );

const checkoutFields = (request: CheckoutRequest, paymentMethodConfiguration: string | null) => ({
  mode: "subscription",
  "line_items[0][price]": request.priceId,
  "line_items[0][quantity]": "1",
  client_reference_id: request.organizationId,
  "metadata[organization_id]": request.organizationId,
  "subscription_data[metadata][organization_id]": request.organizationId,
  customer: request.customerId,
  customer_email: request.customerEmail,
  success_url: request.successUrl,
  cancel_url: request.cancelUrl,
  payment_method_configuration: paymentMethodConfiguration,
  locale: "fr",
});

const PAYMENT_REQUIRED = 402;

const prorationFields = (keyOf: (name: string) => string, proration: Proration): FormFields =>
  proration.kind === "next_invoice"
    ? { [keyOf("proration_behavior")]: "create_prorations" }
    : {
        [keyOf("proration_behavior")]: "always_invoice",
        [keyOf("proration_date")]: String(unixSecondsOf(proration.at)),
      };

const previewKey = (name: string) => `subscription_details[${name}]`;

const updateKey = (name: string) => name;

const subscriptionPath = (subscriptionId: string) =>
  `/subscriptions/${encodeURIComponent(subscriptionId)}`;

export const createStripeGateway = ({
  secretKey,
  paymentMethodConfiguration,
}: {
  readonly secretKey: string;
  readonly paymentMethodConfiguration: string | null;
}): StripeGateway => {
  const call = async (path: string, init: { method: "GET" | "POST"; fields?: FormFields }) => {
    const response = await fetch(`${STRIPE_API}${path}`, {
      method: init.method,
      headers: {
        authorization: `Bearer ${secretKey}`,
        "stripe-version": STRIPE_API_VERSION,
        ...(init.fields === undefined
          ? {}
          : { "content-type": "application/x-www-form-urlencoded" }),
      },
      body: init.fields === undefined ? null : formOf(init.fields).toString(),
    });
    return { status: response.status, body: await response.json() };
  };

  const succeeded = async (path: string, init: { method: "GET" | "POST"; fields?: FormFields }) => {
    const { status, body } = await call(path, init);
    if (status >= 400) {
      throw new Error(`stripe_request_failed:${status}`);
    }
    return body;
  };

  const firstItemIdOf = async (subscriptionId: string) => {
    const itemId = parseFirstItemId(
      await succeeded(subscriptionPath(subscriptionId), { method: "GET" }),
    );
    if (itemId === undefined) {
      throw new Error("stripe_subscription_without_item");
    }
    return itemId;
  };

  const previewPriceChange = async ({ subscriptionId, priceId, proration }: PriceChange) => {
    const itemId = await firstItemIdOf(subscriptionId);
    return {
      amountDueCents: parseAmountDue(
        await succeeded("/invoices/create_preview", {
          method: "POST",
          fields: {
            subscription: subscriptionId,
            "subscription_details[items][0][id]": itemId,
            "subscription_details[items][0][price]": priceId,
            ...prorationFields(previewKey, proration),
          },
        }),
      ),
    };
  };

  const changePrice = async ({ subscriptionId, priceId, proration }: PriceChange) => {
    const itemId = await firstItemIdOf(subscriptionId);
    const { status, body } = await call(subscriptionPath(subscriptionId), {
      method: "POST",
      fields: {
        "items[0][id]": itemId,
        "items[0][price]": priceId,
        ...prorationFields(updateKey, proration),
        payment_behavior: proration.kind === "invoice_now" ? "error_if_incomplete" : null,
        "expand[]": "default_payment_method",
      },
    });
    if (status === PAYMENT_REQUIRED) {
      return undefined;
    }
    if (status >= 400) {
      throw new Error(`stripe_request_failed:${status}`);
    }
    return parseStripeSubscription(body);
  };

  return {
    previewPriceChange,
    changePrice,
    findPriceId: async (lookupKey) =>
      parseFirstPriceId(
        await succeeded(
          `/prices?${new URLSearchParams({ "lookup_keys[]": lookupKey, active: "true", limit: "1" }).toString()}`,
          { method: "GET" },
        ),
      ),
    createCheckoutSession: async (request) => ({
      url: parseSessionUrl(
        await succeeded("/checkout/sessions", {
          method: "POST",
          fields: checkoutFields(request, paymentMethodConfiguration),
        }),
      ),
    }),
    createPortalSession: async ({ customerId, returnUrl }) => ({
      url: parseSessionUrl(
        await succeeded("/billing_portal/sessions", {
          method: "POST",
          fields: { customer: customerId, return_url: returnUrl, locale: "fr" },
        }),
      ),
    }),
    retrieveSubscription: async (subscriptionId) => {
      const { status, body } = await call(
        `/subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=default_payment_method`,
        { method: "GET" },
      );
      if (status === 404) {
        return undefined;
      }
      if (status >= 400) {
        throw new Error(`stripe_request_failed:${status}`);
      }
      return parseStripeSubscription(body);
    },
    listInvoices: async (customerId) =>
      parseInvoices(
        await succeeded(
          `/invoices?${new URLSearchParams({ customer: customerId, limit: String(INVOICE_PAGE_SIZE) }).toString()}`,
          { method: "GET" },
        ),
      ),
  };
};
