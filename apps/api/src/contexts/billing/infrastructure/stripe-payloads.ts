import { INVOICE_STATUSES, SUBSCRIPTION_STATUSES } from "@passalio/shared";
import * as z from "zod";
import type { Invoice, StripeEvent, StripeSubscriptionSnapshot } from "../domain/billing-models";

const stripeReference = z.union([z.string(), z.object({ id: z.string() })]);

type StripeReference = z.infer<typeof stripeReference>;

const referenceId = (reference: StripeReference) =>
  typeof reference === "string" ? reference : reference.id;

const idOf = (reference: StripeReference | null | undefined) =>
  reference === null || reference === undefined ? null : referenceId(reference);

const stripeEventPayload = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string().optional(),
      object: z.string().optional(),
      subscription: stripeReference.nullish(),
      parent: z
        .object({
          subscription_details: z.object({ subscription: stripeReference.nullish() }).nullish(),
        })
        .nullish(),
    }),
  }),
});

const paymentMethodPayload = z.object({
  type: z.string(),
  card: z.object({ last4: z.string() }).nullish(),
  sepa_debit: z.object({ last4: z.string() }).nullish(),
});

const seconds = z.number().int().nonnegative();

const subscriptionPayload = z.object({
  id: z.string(),
  customer: stripeReference,
  status: z.enum(SUBSCRIPTION_STATUSES),
  metadata: z.record(z.string(), z.string()).nullish(),
  cancel_at_period_end: z.boolean(),
  cancel_at: seconds.nullish(),
  ended_at: seconds.nullish(),
  current_period_end: seconds.nullish(),
  default_payment_method: z.union([z.string(), paymentMethodPayload]).nullish(),
  items: z.object({
    data: z.array(
      z.object({
        current_period_end: seconds.nullish(),
        price: z.object({ lookup_key: z.string().nullish() }),
      }),
    ),
  }),
});

const priceListPayload = z.object({ data: z.array(z.object({ id: z.string() })) });

const sessionPayload = z.object({ url: z.url() });

const dateOf = (value: number | null | undefined) =>
  value === null || value === undefined ? null : new Date(value * 1000);

const subscriptionIdOfObject = (
  type: string,
  object: z.infer<typeof stripeEventPayload>["data"]["object"],
) => {
  if (type.startsWith("customer.subscription.")) {
    return object.id ?? null;
  }
  if (type.startsWith("invoice.")) {
    return idOf(object.parent?.subscription_details?.subscription) ?? idOf(object.subscription);
  }
  if (type.startsWith("checkout.session.")) {
    return idOf(object.subscription);
  }
  return null;
};

export const parseStripeEvent = (payload: string): StripeEvent | undefined => {
  try {
    const parsed = stripeEventPayload.safeParse(JSON.parse(payload));
    return parsed.success
      ? {
          id: parsed.data.id,
          type: parsed.data.type,
          subscriptionId: subscriptionIdOfObject(parsed.data.type, parsed.data.data.object),
        }
      : undefined;
  } catch {
    return undefined;
  }
};

const paymentMethodOf = (method: z.infer<typeof subscriptionPayload>["default_payment_method"]) =>
  method === null || method === undefined || typeof method === "string"
    ? null
    : { type: method.type, last4: method.card?.last4 ?? method.sepa_debit?.last4 ?? null };

export const parseStripeSubscription = (body: unknown): StripeSubscriptionSnapshot => {
  const subscription = subscriptionPayload.parse(body);
  const item = subscription.items.data.at(0);
  return {
    id: subscription.id,
    customerId: referenceId(subscription.customer),
    organizationId: subscription.metadata?.organization_id ?? null,
    status: subscription.status,
    lookupKey: item?.price.lookup_key ?? null,
    currentPeriodEnd: dateOf(item?.current_period_end ?? subscription.current_period_end),
    isCancelScheduled:
      subscription.cancel_at_period_end ||
      (subscription.cancel_at !== null && subscription.cancel_at !== undefined),
    endedAt: dateOf(subscription.ended_at),
    paymentMethod: paymentMethodOf(subscription.default_payment_method),
  };
};

export const parseFirstPriceId = (body: unknown): string | undefined =>
  priceListPayload.parse(body).data.at(0)?.id;

export const parseSessionUrl = (body: unknown): string => sessionPayload.parse(body).url;

const invoiceListPayload = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      number: z.string().nullish(),
      created: seconds,
      total: z.number().int(),
      status: z.string().nullish(),
      invoice_pdf: z.url().nullish(),
    }),
  ),
});

const isInvoiceStatus = (status: string | null | undefined): status is Invoice["status"] =>
  INVOICE_STATUSES.some((known) => known === status);

export const parseInvoices = (body: unknown): readonly Invoice[] =>
  invoiceListPayload.parse(body).data.flatMap((invoice) =>
    isInvoiceStatus(invoice.status)
      ? [
          {
            id: invoice.id,
            number: invoice.number ?? null,
            issuedAt: new Date(invoice.created * 1000),
            totalCents: invoice.total,
            status: invoice.status,
            pdfUrl: invoice.invoice_pdf ?? null,
          },
        ]
      : [],
  );

const subscriptionItemsPayload = z.object({
  items: z.object({ data: z.array(z.object({ id: z.string() })) }),
});

export const parseFirstItemId = (body: unknown): string | undefined =>
  subscriptionItemsPayload.parse(body).items.data.at(0)?.id;

const invoicePreviewPayload = z.object({ amount_due: z.number().int() });

export const parseAmountDue = (body: unknown): number =>
  invoicePreviewPayload.parse(body).amount_due;
