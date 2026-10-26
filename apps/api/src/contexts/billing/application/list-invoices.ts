import { assertCan, can, type Actor, type InvoiceResponse } from "@passalio/shared";
import type { BillingDependencies } from "../domain/billing-ports";

export const listInvoices =
  ({ workspaces, stripe }: BillingDependencies) =>
  async (actor: Actor): Promise<readonly InvoiceResponse[]> => {
    assertCan(actor, "organization:read");
    if (stripe === null || !can(actor, "billing:manage")) {
      return [];
    }
    const subscription = (await workspaces.findWorkspace(actor.organizationId))?.subscription;
    if (subscription === null || subscription === undefined) {
      return [];
    }
    const invoices = await stripe.listInvoices(subscription.stripeCustomerId);
    return invoices.map((invoice) => ({ ...invoice, issuedAt: invoice.issuedAt.toISOString() }));
  };
