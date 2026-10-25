import type { Bindings } from "../../../env";
import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { BillingDependencies, StripeGateway } from "../domain/billing-ports";
import { createD1BillingContactDirectory } from "./d1-billing-contact-directory";
import { createD1StripeEventLog } from "./d1-stripe-event-log";
import { createD1SubscriptionRepository } from "./d1-subscription-repository";
import { createD1WorkspaceRepository } from "./d1-workspace-repository";
import { createStripeGateway } from "./stripe-gateway";

export const isBillingEnabled = (bindings: Bindings): boolean =>
  (bindings.STRIPE_SECRET_KEY ?? "") !== "";

const stripeGatewayOf = (bindings: Bindings): StripeGateway | null =>
  bindings.STRIPE_SECRET_KEY === undefined || !isBillingEnabled(bindings)
    ? null
    : createStripeGateway({
        secretKey: bindings.STRIPE_SECRET_KEY,
        paymentMethodConfiguration: bindings.STRIPE_PAYMENT_METHOD_CONFIGURATION ?? null,
      });

export const createBillingDependencies = ({
  database,
  auditTrail,
  bindings,
}: {
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly bindings: Bindings;
}): BillingDependencies => ({
  workspaces: createD1WorkspaceRepository(database),
  subscriptions: createD1SubscriptionRepository(database),
  contacts: createD1BillingContactDirectory(database),
  stripeEvents: createD1StripeEventLog(database),
  stripe: stripeGatewayOf(bindings),
  auditTrail: {
    record: async (entry) =>
      auditTrail.record({ ...entry, targetType: "subscription", targetId: entry.organizationId }),
  },
  appUrl: bindings.APP_URL,
  now: () => new Date(),
});
