import type { CheckoutRequest } from "../domain/billing-models";
import type { StripeGateway } from "../domain/billing-ports";
import { parseFirstPriceId, parseSessionUrl, parseStripeSubscription } from "./stripe-payloads";

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

  return {
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
  };
};
