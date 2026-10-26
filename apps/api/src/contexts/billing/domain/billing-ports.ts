import type {
  CheckoutRequest,
  Invoice,
  StripeEvent,
  StripeSubscriptionSnapshot,
  Subscription,
  Workspace,
} from "./billing-models";

export type WorkspaceRepository = {
  readonly findWorkspace: (organizationId: string) => Promise<Workspace | undefined>;
};

export type SubscriptionRepository = {
  readonly save: (subscription: Subscription) => Promise<void>;
};

export type BillingContactDirectory = {
  readonly findEmail: (userId: string) => Promise<string | undefined>;
  readonly findOwnerName: (organizationId: string) => Promise<string | undefined>;
  readonly countTechnicians: (organizationId: string) => Promise<number>;
  readonly countPendingTechnicianInvitations: (organizationId: string) => Promise<number>;
};

export type StripeEventLog = {
  readonly hasProcessed: (eventId: string) => Promise<boolean>;
  readonly markProcessed: (event: StripeEvent, at: Date) => Promise<void>;
};

export type StripeGateway = {
  readonly findPriceId: (lookupKey: string) => Promise<string | undefined>;
  readonly createCheckoutSession: (request: CheckoutRequest) => Promise<{ readonly url: string }>;
  readonly createPortalSession: (input: {
    readonly customerId: string;
    readonly returnUrl: string;
  }) => Promise<{ readonly url: string }>;
  readonly retrieveSubscription: (
    subscriptionId: string,
  ) => Promise<StripeSubscriptionSnapshot | undefined>;
  readonly listInvoices: (customerId: string) => Promise<readonly Invoice[]>;
};

export type BillingAuditEntry = {
  readonly organizationId: string;
  readonly actorUserId: string | null;
  readonly action: "billing.checkout_started" | "billing.subscription_updated";
  readonly data: Readonly<Record<string, string>>;
};

export type BillingAuditTrail = {
  readonly record: (entry: BillingAuditEntry) => Promise<void>;
};

export type BillingDependencies = {
  readonly workspaces: WorkspaceRepository;
  readonly subscriptions: SubscriptionRepository;
  readonly contacts: BillingContactDirectory;
  readonly stripeEvents: StripeEventLog;
  readonly stripe: StripeGateway | null;
  readonly auditTrail: BillingAuditTrail;
  readonly appUrl: string;
  readonly now: () => Date;
};
