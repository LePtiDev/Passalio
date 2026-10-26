import { newId } from "@passalio/shared";
import type { Subscription } from "../../src/contexts/billing/domain/billing-models";
import type { CatalogedQuery } from "./cataloged-query";
import { AT, LATER } from "./domain-fixtures";

const aSubscription = (organizationId: string, at: Date): Subscription => ({
  id: newId(),
  organizationId,
  plan: "team",
  interval: "month",
  isFounder: false,
  status: "active",
  stripeCustomerId: "cus_catalogue",
  stripeSubscriptionId: "sub_catalogue",
  currentPeriodEnd: LATER,
  isCancelScheduled: false,
  endedAt: null,
  paymentFailedAt: null,
  paymentMethod: { type: "card", last4: "4242" },
  createdAt: at,
  updatedAt: at,
});

export const BILLING_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "billingWorkspaces.findWorkspace",
    query: "creation date and subscription of an organization",
    run: async (r, s) => {
      await r.billingSubscriptions.save(aSubscription(s.organization.id, AT));
      return r.billingWorkspaces.findWorkspace(s.organization.id);
    },
  },
  {
    method: "billingSubscriptions.save",
    query: "save the subscription of an organization from Stripe",
    run: async (r, s) => {
      await r.billingSubscriptions.save(aSubscription(s.otherOrganization.id, AT));
      await r.billingSubscriptions.save({
        ...aSubscription(s.otherOrganization.id, LATER),
        status: "past_due",
        paymentFailedAt: LATER,
      });
    },
  },
  {
    method: "billingContacts.findEmail",
    query: "email of the owner who subscribes",
    run: (r, s) => r.billingContacts.findEmail(s.owner.id),
  },
  {
    method: "billingContacts.findOwnerName",
    query: "name of the owner shown to the members",
    run: (r, s) => r.billingContacts.findOwnerName(s.organization.id),
  },
  {
    method: "billingContacts.countTechnicians",
    query: "technicians counted by the plan",
    run: (r, s) => r.billingContacts.countTechnicians(s.organization.id),
  },
  {
    method: "stripeEvents.hasProcessed",
    query: "Stripe event already handled",
    run: (r) => r.stripeEvents.hasProcessed("evt_catalogue"),
  },
  {
    method: "stripeEvents.markProcessed",
    query: "remember a handled Stripe event",
    run: async (r) => {
      const event = { id: "evt_catalogue", type: "invoice.paid", subscriptionId: null };
      await r.stripeEvents.markProcessed(event, AT);
      await r.stripeEvents.markProcessed(event, LATER);
    },
  },
];
