import { invoicesResponse, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import { aSubscription, DURING_TRIAL, ORGANIZATION_ID } from "./billing.fixture";
import { listInvoices } from "./list-invoices";

let state: InMemoryBillingState;

const list = (actor = organizationActorWith("owner"), isBillingEnabled = true) =>
  listInvoices(createInMemoryBillingDependencies(state, () => DURING_TRIAL, { isBillingEnabled }))(
    actor,
  );

const PAID_INVOICE = {
  id: "in_1",
  number: "PASSALIO-0001",
  issuedAt: new Date("2026-10-24T10:00:00.000Z"),
  totalCents: 2900,
  status: "paid",
  pdfUrl: "https://pay.stripe.com/invoice/in_1/pdf",
} as const;

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, DURING_TRIAL);
});

describe("listInvoices", () => {
  it("lists the Stripe invoices of the customer of the company", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    state.stripe.invoices.set("cus_ramonage", [PAID_INVOICE]);
    state.stripe.invoices.set("cus_other", [{ ...PAID_INVOICE, id: "in_other" }]);
    const result = await list();
    expect(invoicesResponse.parse({ invoices: result })).toEqual({
      invoices: [{ ...PAID_INVOICE, issuedAt: "2026-10-24T10:00:00.000Z" }],
    });
  });

  it("gives an empty list to a company that never subscribed", async () => {
    state.stripe.invoices.set("cus_ramonage", [PAID_INVOICE]);
    const result = await list();
    expect(result).toEqual([]);
  });

  it("gives an empty list while online payment is not available", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    state.stripe.invoices.set("cus_ramonage", [PAID_INVOICE]);
    expect(await list(organizationActorWith("owner"), false)).toEqual([]);
  });

  it.each(ORGANIZATION_ROLES.filter((role) => role !== "owner"))(
    "gives the %s no invoice, since only the owner sees them",
    async (role) => {
      state.subscriptions.set(ORGANIZATION_ID, aSubscription());
      state.stripe.invoices.set("cus_ramonage", [PAID_INVOICE]);
      const result = await list(organizationActorWith(role));
      expect(result).toEqual([]);
    },
  );

  it("gives an impersonating superadmin no invoice, like the payment method", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    state.stripe.invoices.set("cus_ramonage", [PAID_INVOICE]);
    const result = await list(organizationActorWith("owner", { isImpersonating: true }));
    expect(result).toEqual([]);
  });
});
