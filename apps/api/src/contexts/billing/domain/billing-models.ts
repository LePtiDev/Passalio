import type { BillingInterval, InvoiceStatus, Plan, SubscriptionStatus } from "@passalio/shared";

export type PaymentMethod = {
  readonly type: string;
  readonly last4: string | null;
};

export type Subscription = {
  readonly id: string;
  readonly organizationId: string;
  readonly plan: Plan;
  readonly interval: BillingInterval;
  readonly isFounder: boolean;
  readonly status: SubscriptionStatus;
  readonly stripeCustomerId: string;
  readonly stripeSubscriptionId: string;
  readonly currentPeriodEnd: Date | null;
  readonly isCancelScheduled: boolean;
  readonly endedAt: Date | null;
  readonly paymentFailedAt: Date | null;
  readonly paymentMethod: PaymentMethod | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type Workspace = {
  readonly organizationId: string;
  readonly organizationCreatedAt: Date;
  readonly subscription: Subscription | null;
};

export type StripeSubscriptionSnapshot = {
  readonly id: string;
  readonly customerId: string;
  readonly organizationId: string | null;
  readonly status: SubscriptionStatus;
  readonly lookupKey: string | null;
  readonly currentPeriodEnd: Date | null;
  readonly isCancelScheduled: boolean;
  readonly endedAt: Date | null;
  readonly paymentMethod: PaymentMethod | null;
};

export type StripeEvent = {
  readonly id: string;
  readonly type: string;
  readonly subscriptionId: string | null;
};

export type CheckoutRequest = {
  readonly organizationId: string;
  readonly priceId: string;
  readonly customerId: string | null;
  readonly customerEmail: string | null;
  readonly successUrl: string;
  readonly cancelUrl: string;
};

export type Invoice = {
  readonly id: string;
  readonly number: string | null;
  readonly issuedAt: Date;
  readonly totalCents: number;
  readonly status: InvoiceStatus;
  readonly pdfUrl: string | null;
};

export type Proration =
  | { readonly kind: "invoice_now"; readonly at: Date }
  | { readonly kind: "next_invoice" };

export type PriceChange = {
  readonly subscriptionId: string;
  readonly priceId: string;
  readonly proration: Proration;
};
