import { beforeEach, describe, expect, it } from "vitest";
import type { StripeEvent } from "../domain/billing-models";
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
import { handleStripeEvent } from "./handle-stripe-event";

let state: InMemoryBillingState;

const SOLO_CHOSEN_IN_PORTAL: StripeEvent = {
  id: "evt_solo",
  type: "customer.subscription.updated",
  subscriptionId: "sub_ramonage",
};

const handle = () =>
  handleStripeEvent(createInMemoryBillingDependencies(state, () => AFTER_TRIAL))(
    SOLO_CHOSEN_IN_PORTAL,
  );

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "team" }));
  state.stripe.subscriptions.set(
    "sub_ramonage",
    aStripeSubscription({ lookupKey: "solo_monthly" }),
  );
  state.technicianCounts.set(ORGANIZATION_ID, 2);
});

describe("a switch from Équipe to Solo with several technicians", () => {
  it("puts Équipe back at Stripe, prorated on the next invoice", async () => {
    expect(await handle()).toBe("processed");
    expect(state.stripe.priceChanges).toEqual([
      {
        subscriptionId: "sub_ramonage",
        priceId: "price_team_monthly",
        proration: { kind: "next_invoice" },
      },
    ]);
    expect(state.stripe.subscriptions.get("sub_ramonage")?.lookupKey).toBe("team_monthly");
  });

  it("keeps Équipe for the company", async () => {
    await handle();
    expect(state.subscriptions.get(ORGANIZATION_ID)?.plan).toBe("team");
  });

  it("writes the refusal in the company's journal", async () => {
    await handle();
    expect(state.auditEntries).toEqual([
      {
        organizationId: ORGANIZATION_ID,
        actorUserId: null,
        action: "billing.downgrade_reverted",
        data: { technicianSeats: "2" },
      },
    ]);
  });

  it("counts a pending technician invitation", async () => {
    state.technicianCounts.set(ORGANIZATION_ID, 1);
    state.pendingTechnicianInvitations.set(ORGANIZATION_ID, 1);
    await handle();
    expect(state.subscriptions.get(ORGANIZATION_ID)?.plan).toBe("team");
  });

  it("puts back the yearly Équipe price of a yearly subscription", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "team", interval: "year" }));
    await handle();
    expect(state.stripe.priceChanges.map(({ priceId }) => priceId)).toEqual(["price_team_yearly"]);
  });

  it("puts back the founder price of a founder", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "team", isFounder: true }));
    await handle();
    expect(state.stripe.priceChanges.map(({ priceId }) => priceId)).toEqual([
      "price_founder_monthly",
    ]);
    expect(state.subscriptions.get(ORGANIZATION_ID)?.isFounder).toBe(true);
  });
});

describe("a switch from Équipe to Solo with one technician", () => {
  it("accepts Solo", async () => {
    state.technicianCounts.set(ORGANIZATION_ID, 1);
    await handle();
    expect(state.stripe.priceChanges).toEqual([]);
    expect(state.subscriptions.get(ORGANIZATION_ID)?.plan).toBe("solo");
  });
});
