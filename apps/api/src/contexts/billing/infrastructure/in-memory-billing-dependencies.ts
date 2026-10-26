import type {
  CheckoutRequest,
  Invoice,
  PriceChange,
  StripeEvent,
  StripeSubscriptionSnapshot,
  Subscription,
} from "../domain/billing-models";
import type {
  BillingAuditEntry,
  BillingDependencies,
  StripeGateway,
} from "../domain/billing-ports";

export type InMemoryStripeState = {
  readonly prices: Map<string, string>;
  readonly subscriptions: Map<string, StripeSubscriptionSnapshot>;
  readonly checkoutRequests: CheckoutRequest[];
  readonly portalRequests: { readonly customerId: string; readonly returnUrl: string }[];
  readonly invoices: Map<string, readonly Invoice[]>;
  readonly previewAmounts: Map<string, number>;
  readonly refusedPayments: Set<string>;
  readonly priceChanges: PriceChange[];
  readonly previewRequests: PriceChange[];
};

export type InMemoryBillingState = {
  readonly organizations: Map<string, Date>;
  readonly subscriptions: Map<string, Subscription>;
  readonly emails: Map<string, string>;
  readonly ownerNames: Map<string, string>;
  readonly technicianCounts: Map<string, number>;
  readonly pendingTechnicianInvitations: Map<string, number>;
  readonly processedEvents: Map<string, StripeEvent>;
  readonly auditEntries: BillingAuditEntry[];
  readonly stripe: InMemoryStripeState;
};

export const IN_MEMORY_APP_URL = "https://app.passalio.test";

export const createInMemoryBillingState = (): InMemoryBillingState => ({
  organizations: new Map(),
  subscriptions: new Map(),
  emails: new Map(),
  ownerNames: new Map(),
  technicianCounts: new Map(),
  pendingTechnicianInvitations: new Map(),
  processedEvents: new Map(),
  auditEntries: [],
  stripe: {
    prices: new Map([
      ["solo_monthly", "price_solo_monthly"],
      ["solo_yearly", "price_solo_yearly"],
      ["team_monthly", "price_team_monthly"],
      ["team_yearly", "price_team_yearly"],
      ["founder_monthly", "price_founder_monthly"],
    ]),
    subscriptions: new Map(),
    checkoutRequests: [],
    portalRequests: [],
    invoices: new Map(),
    previewAmounts: new Map(),
    refusedPayments: new Set(),
    priceChanges: [],
    previewRequests: [],
  },
});

const lookupKeyOfPrice = (state: InMemoryStripeState, priceId: string) =>
  [...state.prices].find(([, id]) => id === priceId)?.[0] ?? null;

const changeInMemoryPrice = (state: InMemoryStripeState, change: PriceChange) => {
  state.priceChanges.push(change);
  const current = state.subscriptions.get(change.subscriptionId);
  if (current === undefined) {
    throw new Error("stripe_subscription_not_found");
  }
  if (change.proration.kind === "invoice_now" && state.refusedPayments.has(change.subscriptionId)) {
    return undefined;
  }
  const next = { ...current, lookupKey: lookupKeyOfPrice(state, change.priceId) };
  state.subscriptions.set(change.subscriptionId, next);
  return next;
};

const createInMemoryStripeGateway = (state: InMemoryStripeState): StripeGateway => ({
  findPriceId: async (lookupKey) => state.prices.get(lookupKey),
  createCheckoutSession: async (request) => {
    state.checkoutRequests.push(request);
    return { url: `https://checkout.stripe.test/${state.checkoutRequests.length}` };
  },
  createPortalSession: async (input) => {
    state.portalRequests.push(input);
    return { url: `https://billing.stripe.test/${state.portalRequests.length}` };
  },
  retrieveSubscription: async (subscriptionId) => state.subscriptions.get(subscriptionId),
  listInvoices: async (customerId) => state.invoices.get(customerId) ?? [],
  previewPriceChange: async (change) => {
    state.previewRequests.push(change);
    return { amountDueCents: state.previewAmounts.get(change.subscriptionId) ?? 0 };
  },
  changePrice: async (change) => changeInMemoryPrice(state, change),
});

export const createInMemoryBillingDependencies = (
  state: InMemoryBillingState,
  now: () => Date,
  { isBillingEnabled = true }: { readonly isBillingEnabled?: boolean } = {},
): BillingDependencies => ({
  workspaces: {
    findWorkspace: async (organizationId) => {
      const organizationCreatedAt = state.organizations.get(organizationId);
      return organizationCreatedAt === undefined
        ? undefined
        : {
            organizationId,
            organizationCreatedAt,
            subscription: state.subscriptions.get(organizationId) ?? null,
          };
    },
  },
  subscriptions: {
    save: async (subscription) => {
      state.subscriptions.set(subscription.organizationId, subscription);
    },
  },
  contacts: {
    findEmail: async (userId) => state.emails.get(userId),
    findOwnerName: async (organizationId) => state.ownerNames.get(organizationId),
    countTechnicians: async (organizationId) => state.technicianCounts.get(organizationId) ?? 0,
    countPendingTechnicianInvitations: async (organizationId) =>
      state.pendingTechnicianInvitations.get(organizationId) ?? 0,
  },
  stripeEvents: {
    hasProcessed: async (eventId) => state.processedEvents.has(eventId),
    markProcessed: async (event) => {
      state.processedEvents.set(event.id, event);
    },
  },
  stripe: isBillingEnabled ? createInMemoryStripeGateway(state.stripe) : null,
  auditTrail: {
    record: async (entry) => {
      state.auditEntries.push(entry);
    },
  },
  appUrl: IN_MEMORY_APP_URL,
  now,
});
