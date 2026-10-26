import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import {
  AFTER_TRIAL,
  aStripeSubscription,
  aSubscription,
  CREATED_AT,
  ORGANIZATION_ID,
  PERIOD_END,
} from "./billing.fixture";
import { previewTeamUpgrade } from "./preview-team-upgrade";

let state: InMemoryBillingState;

const preview = (actor = organizationActorWith("owner"), isBillingEnabled = true) =>
  previewTeamUpgrade(
    createInMemoryBillingDependencies(state, () => AFTER_TRIAL, { isBillingEnabled }),
  )(actor);

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo" }));
  state.stripe.subscriptions.set(
    "sub_ramonage",
    aStripeSubscription({ lookupKey: "solo_monthly" }),
  );
  state.stripe.previewAmounts.set("sub_ramonage", 1000);
});

describe("previewTeamUpgrade", () => {
  it("gives the prorated amount Stripe would charge today for Équipe", async () => {
    expect(await preview()).toEqual({
      isOk: true,
      value: {
        amountDueCents: 1000,
        interval: "month",
        currentPeriodEndsAt: PERIOD_END.toISOString(),
        prorationDate: Math.floor(AFTER_TRIAL.getTime() / 1000),
      },
    });
  });

  it("asks Stripe for the Équipe price of the same interval, invoiced now", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo", interval: "year" }));
    expect((await preview()).isOk).toBe(true);
    expect(state.stripe.previewRequests).toEqual([
      {
        subscriptionId: "sub_ramonage",
        priceId: "price_team_yearly",
        proration: { kind: "invoice_now", at: AFTER_TRIAL },
      },
    ]);
  });

  it("changes nothing at Stripe", async () => {
    await preview();
    expect(state.stripe.priceChanges).toEqual([]);
  });

  it("refuses a company already on Équipe", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "team" }));
    expect(await preview()).toEqual({ isOk: false, error: "not_on_solo" });
  });

  it("refuses a company without a live subscription", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo", status: "canceled" }));
    expect(await preview()).toEqual({ isOk: false, error: "no_subscription" });
  });

  it("refuses a company that never subscribed", async () => {
    state.subscriptions.delete(ORGANIZATION_ID);
    expect(await preview()).toEqual({ isOk: false, error: "no_subscription" });
  });

  it("refuses when the Équipe price is missing in Stripe", async () => {
    state.stripe.prices.delete("team_monthly");
    expect(await preview()).toEqual({ isOk: false, error: "price_not_found" });
  });

  it("refuses when online payment is not configured", async () => {
    expect(await preview(organizationActorWith("owner"), false)).toEqual({
      isOk: false,
      error: "billing_unavailable",
    });
  });

  it.each(ORGANIZATION_ROLES.filter((role) => role !== "owner"))("refuses the %s", async (role) => {
    await expect(preview(organizationActorWith(role))).rejects.toThrow(ForbiddenError);
  });
});
