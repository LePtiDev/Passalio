import type {
  InvoiceResponse,
  SubscriptionDetailsResponse,
  SubscriptionResponse,
} from "@passalio/shared";
import { jsonReply } from "./fake-api";

export const SUBSCRIPTION_ROUTE = "GET /api/billing/subscription";
export const SEATS_ROUTE = "GET /api/billing/seats";
export const INVOICES_ROUTE = "GET /api/billing/invoices";
export const CHECKOUT_ROUTE = "POST /api/billing/checkout";
export const PORTAL_ROUTE = "POST /api/billing/portal";

const DAY_MS = 24 * 60 * 60 * 1000;

export const inDays = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

export const subscriptionDetails = (
  changes: Partial<SubscriptionDetailsResponse> = {},
): SubscriptionDetailsResponse => ({
  plan: "solo",
  interval: "month",
  isFounder: false,
  currentPeriodEndsAt: "2026-11-24T10:00:00.000Z",
  isCancelScheduled: false,
  paymentMethod: { type: "card", last4: "4242" },
  ...changes,
});

export const subscriptionState = (
  changes: Partial<SubscriptionResponse> = {},
): SubscriptionResponse => ({
  workspaceState: "trial",
  blockedReason: null,
  trialEndsAt: inDays(3),
  graceEndsAt: null,
  isBillingEnabled: true,
  canManage: true,
  subscription: null,
  ...changes,
});

export const subscriptionReply = (changes: Partial<SubscriptionResponse> = {}) =>
  jsonReply({ subscription: subscriptionState(changes) });

export const seatsReply = (technicianCount = 1, ownerName: string | null = "Jean Dupont") =>
  jsonReply({ seats: { technicianCount, ownerName } });

export const anInvoice = (changes: Partial<InvoiceResponse> = {}): InvoiceResponse => ({
  id: "in_1",
  number: "PASSALIO-0001",
  issuedAt: "2026-10-24T10:00:00.000Z",
  totalCents: 2900,
  status: "paid",
  pdfUrl: "https://pay.stripe.com/invoice/in_1/pdf",
  ...changes,
});

export const invoicesReply = (invoices: readonly InvoiceResponse[] = [anInvoice()]) =>
  jsonReply({ invoices });

export const redirectReply = (url: string) => jsonReply({ url });
