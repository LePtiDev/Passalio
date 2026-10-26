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
} from "./billing.fixture";
import { upgradeToTeam } from "./upgrade-to-team";

const PREVIEWED_AT = Math.floor(AFTER_TRIAL.getTime() / 1000) - 120;

let state: InMemoryBillingState;

const upgrade = (
  prorationDate = PREVIEWED_AT,
  actor = organizationActorWith("owner"),
  isBillingEnabled = true,
) =>
  upgradeToTeam(createInMemoryBillingDependencies(state, () => AFTER_TRIAL, { isBillingEnabled }))(
    actor,
    { prorationDate },
  );

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo" }));
  state.stripe.subscriptions.set(
    "sub_ramonage",
    aStripeSubscription({ lookupKey: "solo_monthly" }),
  );
});

describe("upgradeToTeam", () => {
  it("switches the Stripe subscription to Équipe now, at the previewed prorata", async () => {
    expect(await upgrade()).toEqual({ isOk: true, value: undefined });
    expect(state.stripe.priceChanges).toEqual([
      {
        subscriptionId: "sub_ramonage",
        priceId: "price_team_monthly",
        proration: { kind: "invoice_now", at: new Date(PREVIEWED_AT * 1000) },
      },
    ]);
  });

  it("stores Équipe at once, so the invitation can follow", async () => {
    await upgrade();
    expect(state.subscriptions.get(ORGANIZATION_ID)?.plan).toBe("team");
  });

  it("keeps the yearly interval of a yearly Solo", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo", interval: "year" }));
    await upgrade();
    expect(state.stripe.priceChanges.map(({ priceId }) => priceId)).toEqual(["price_team_yearly"]);
  });

  it("writes the change in the company's journal", async () => {
    await upgrade();
    expect(state.auditEntries).toEqual([
      {
        organizationId: ORGANIZATION_ID,
        actorUserId: "user-owner",
        action: "billing.plan_upgraded",
        data: { from: "solo", to: "team", interval: "month" },
      },
    ]);
  });

  it("keeps Solo when the card is refused", async () => {
    state.stripe.refusedPayments.add("sub_ramonage");
    expect(await upgrade()).toEqual({ isOk: false, error: "payment_failed" });
    expect(state.subscriptions.get(ORGANIZATION_ID)?.plan).toBe("solo");
    expect(state.auditEntries).toEqual([]);
  });

  it("refuses a preview older than thirty minutes, so the amount shown stays true", async () => {
    expect(await upgrade(PREVIEWED_AT - 30 * 60)).toEqual({
      isOk: false,
      error: "preview_expired",
    });
    expect(state.stripe.priceChanges).toEqual([]);
  });

  it("refuses a preview dated in the future", async () => {
    expect(await upgrade(PREVIEWED_AT + 10 * 60)).toEqual({
      isOk: false,
      error: "preview_expired",
    });
  });

  it("refuses a company already on Équipe", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "team" }));
    expect(await upgrade()).toEqual({ isOk: false, error: "not_on_solo" });
    expect(state.stripe.priceChanges).toEqual([]);
  });

  it("refuses when online payment is not configured", async () => {
    expect(await upgrade(PREVIEWED_AT, organizationActorWith("owner"), false)).toEqual({
      isOk: false,
      error: "billing_unavailable",
    });
  });

  it.each(ORGANIZATION_ROLES.filter((role) => role !== "owner"))("refuses the %s", async (role) => {
    await expect(upgrade(PREVIEWED_AT, organizationActorWith(role))).rejects.toThrow(
      ForbiddenError,
    );
    expect(state.stripe.priceChanges).toEqual([]);
  });
});
