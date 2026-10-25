import {
  ForbiddenError,
  ORGANIZATION_ROLES,
  type OrganizationRole,
  type StartCheckoutBody,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  IN_MEMORY_APP_URL,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import { AFTER_TRIAL, aSubscription, CREATED_AT, ORGANIZATION_ID } from "./billing.fixture";
import { startCheckout } from "./start-checkout";

const OWNER = organizationActorWith("owner");

let state: InMemoryBillingState;

const checkout = (
  actor = OWNER,
  body: StartCheckoutBody = { plan: "team", interval: "month" },
  isBillingEnabled = true,
) =>
  startCheckout(createInMemoryBillingDependencies(state, () => AFTER_TRIAL, { isBillingEnabled }))(
    actor,
    body,
  );

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  state.emails.set(OWNER.userId, "patron@ramonage-martin.fr");
});

describe("startCheckout", () => {
  it("opens a Stripe Checkout for the chosen plan, tied to the company", async () => {
    expect(await checkout()).toEqual({
      isOk: true,
      value: { url: "https://checkout.stripe.test/1" },
    });
    expect(state.stripe.checkoutRequests).toEqual([
      {
        organizationId: ORGANIZATION_ID,
        priceId: "price_team_monthly",
        customerId: null,
        customerEmail: "patron@ramonage-martin.fr",
        successUrl: `${IN_MEMORY_APP_URL}/reglages/abonnement?paiement=ok`,
        cancelUrl: `${IN_MEMORY_APP_URL}/reglages/abonnement`,
      },
    ]);
  });

  it.each([
    ["solo", "month", "price_solo_monthly"],
    ["solo", "year", "price_solo_yearly"],
    ["team", "year", "price_team_yearly"],
  ] as const)("finds the %s %s price by its lookup key", async (plan, interval, priceId) => {
    await checkout(OWNER, { plan, interval });
    expect(state.stripe.checkoutRequests.at(0)?.priceId).toBe(priceId);
  });

  it("records the start of the checkout in the company journal", async () => {
    await checkout();
    expect(state.auditEntries).toEqual([
      {
        organizationId: ORGANIZATION_ID,
        actorUserId: OWNER.userId,
        action: "billing.checkout_started",
        data: { plan: "team", interval: "month" },
      },
    ]);
  });

  it("reuses the Stripe customer of a canceled subscription", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ status: "canceled" }));
    await checkout();
    expect(state.stripe.checkoutRequests.at(0)).toMatchObject({
      customerId: "cus_ramonage",
      customerEmail: null,
    });
  });

  it.each(["active", "past_due", "incomplete", "unpaid"] as const)(
    "refuses a second subscription while one is %s",
    async (status) => {
      state.subscriptions.set(ORGANIZATION_ID, aSubscription({ status }));
      expect(await checkout()).toEqual({ isOk: false, error: "already_subscribed" });
      expect(state.stripe.checkoutRequests).toEqual([]);
    },
  );

  it("refuses when online payment is not configured", async () => {
    expect(await checkout(OWNER, { plan: "solo", interval: "month" }, false)).toEqual({
      isOk: false,
      error: "billing_unavailable",
    });
  });

  it("refuses when Stripe has no price for the plan", async () => {
    state.stripe.prices.delete("team_monthly");
    expect(await checkout()).toEqual({ isOk: false, error: "price_not_found" });
    expect(state.auditEntries).toEqual([]);
  });

  it.each(
    ORGANIZATION_ROLES.filter(
      (role): role is Exclude<OrganizationRole, "owner"> => role !== "owner",
    ),
  )("refuses the %s, since only the owner manages the subscription", async (role) => {
    await expect(checkout(organizationActorWith(role))).rejects.toThrow(ForbiddenError);
    expect(state.stripe.checkoutRequests).toEqual([]);
  });

  it("refuses an impersonating superadmin", async () => {
    await expect(
      checkout(organizationActorWith("owner", { isImpersonating: true })),
    ).rejects.toThrow(ForbiddenError);
  });
});
