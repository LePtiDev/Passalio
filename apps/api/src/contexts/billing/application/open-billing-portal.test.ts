import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  IN_MEMORY_APP_URL,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import { AFTER_TRIAL, aSubscription, CREATED_AT, ORGANIZATION_ID } from "./billing.fixture";
import { openBillingPortal } from "./open-billing-portal";

let state: InMemoryBillingState;

const open = (actor = organizationActorWith("owner"), isBillingEnabled = true) =>
  openBillingPortal(
    createInMemoryBillingDependencies(state, () => AFTER_TRIAL, { isBillingEnabled }),
  )(actor);

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
});

describe("openBillingPortal", () => {
  it("opens the Stripe portal of the company's customer, back to the subscription settings", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    expect(await open()).toEqual({ isOk: true, value: { url: "https://billing.stripe.test/1" } });
    expect(state.stripe.portalRequests).toEqual([
      { customerId: "cus_ramonage", returnUrl: `${IN_MEMORY_APP_URL}/reglages/abonnement` },
    ]);
  });

  it("opens the portal after a cancellation, to find past invoices", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ status: "canceled" }));
    expect((await open()).isOk).toBe(true);
  });

  it("refuses a company that never subscribed", async () => {
    expect(await open()).toEqual({ isOk: false, error: "no_subscription" });
  });

  it("refuses when online payment is not configured", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    expect(await open(organizationActorWith("owner"), false)).toEqual({
      isOk: false,
      error: "billing_unavailable",
    });
  });

  it.each(ORGANIZATION_ROLES.filter((role) => role !== "owner"))("refuses the %s", async (role) => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    await expect(open(organizationActorWith(role))).rejects.toThrow(ForbiddenError);
    expect(state.stripe.portalRequests).toEqual([]);
  });
});
