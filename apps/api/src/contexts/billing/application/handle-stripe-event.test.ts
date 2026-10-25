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
  PERIOD_END,
} from "./billing.fixture";
import { handleStripeEvent } from "./handle-stripe-event";

const LATER = new Date("2026-11-25T08:00:00.000Z");

let state: InMemoryBillingState;
let now: Date;

const anEvent = (changes: Partial<StripeEvent> = {}): StripeEvent => ({
  id: "evt_1",
  type: "customer.subscription.updated",
  subscriptionId: "sub_ramonage",
  ...changes,
});

const handle = (event = anEvent(), isBillingEnabled = true) =>
  handleStripeEvent(createInMemoryBillingDependencies(state, () => now, { isBillingEnabled }))(
    event,
  );

const stored = () => state.subscriptions.get(ORGANIZATION_ID);

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  state.stripe.subscriptions.set("sub_ramonage", aStripeSubscription());
  now = AFTER_TRIAL;
});

describe("handleStripeEvent", () => {
  it("stores the subscription read again from Stripe, not from the event", async () => {
    expect(await handle(anEvent({ type: "checkout.session.completed" }))).toBe("processed");
    expect(stored()).toEqual({
      id: expect.any(String),
      organizationId: ORGANIZATION_ID,
      plan: "team",
      interval: "month",
      isFounder: false,
      status: "active",
      stripeCustomerId: "cus_ramonage",
      stripeSubscriptionId: "sub_ramonage",
      currentPeriodEnd: PERIOD_END,
      isCancelScheduled: false,
      endedAt: null,
      paymentFailedAt: null,
      paymentMethod: { type: "card", last4: "4242" },
      createdAt: AFTER_TRIAL,
      updatedAt: AFTER_TRIAL,
    });
  });

  it("handles each Stripe event only once", async () => {
    await handle();
    state.stripe.subscriptions.set("sub_ramonage", aStripeSubscription({ status: "canceled" }));
    expect(await handle()).toBe("duplicate");
    expect(stored()?.status).toBe("active");
  });

  it("remembers every handled event, even one without subscription", async () => {
    expect(await handle(anEvent({ id: "evt_2", type: "invoice.paid", subscriptionId: null }))).toBe(
      "ignored",
    );
    expect(state.processedEvents.has("evt_2")).toBe(true);
  });

  it("keeps the identity and creation date of the stored subscription on an update", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ id: "subscription-a" }));
    now = LATER;
    state.stripe.subscriptions.set(
      "sub_ramonage",
      aStripeSubscription({ lookupKey: "solo_yearly", isCancelScheduled: true }),
    );
    await handle();
    expect(stored()).toMatchObject({
      id: "subscription-a",
      createdAt: CREATED_AT,
      updatedAt: LATER,
      plan: "solo",
      interval: "year",
      isCancelScheduled: true,
    });
  });

  it("dates the first refused payment and keeps it while payments keep failing", async () => {
    state.stripe.subscriptions.set("sub_ramonage", aStripeSubscription({ status: "past_due" }));
    await handle(anEvent({ id: "evt_failed_1", type: "invoice.payment_failed" }));
    now = LATER;
    await handle(anEvent({ id: "evt_failed_2", type: "invoice.payment_failed" }));
    expect(stored()?.paymentFailedAt).toEqual(AFTER_TRIAL);
  });

  it("clears the refused payment once Stripe says the subscription is active again", async () => {
    state.subscriptions.set(
      ORGANIZATION_ID,
      aSubscription({ status: "past_due", paymentFailedAt: AFTER_TRIAL }),
    );
    await handle(anEvent({ type: "invoice.paid" }));
    expect(stored()).toMatchObject({ status: "active", paymentFailedAt: null });
  });

  it("does not carry the failure date of an older subscription to a new one", async () => {
    state.subscriptions.set(
      ORGANIZATION_ID,
      aSubscription({
        status: "canceled",
        stripeSubscriptionId: "sub_old",
        paymentFailedAt: CREATED_AT,
      }),
    );
    state.stripe.subscriptions.set("sub_ramonage", aStripeSubscription({ status: "past_due" }));
    await handle();
    expect(stored()?.paymentFailedAt).toEqual(AFTER_TRIAL);
  });

  it("records the founder offer from the founder price", async () => {
    state.stripe.subscriptions.set(
      "sub_ramonage",
      aStripeSubscription({ lookupKey: "founder_monthly" }),
    );
    await handle();
    expect(stored()).toMatchObject({ plan: "team", interval: "month", isFounder: true });
  });

  it("records a change of state in the company journal, without the system as actor", async () => {
    await handle();
    expect(state.auditEntries).toEqual([
      {
        organizationId: ORGANIZATION_ID,
        actorUserId: null,
        action: "billing.subscription_updated",
        data: { status: "active", plan: "team", interval: "month" },
      },
    ]);
  });

  it("writes nothing in the journal when nothing visible changed", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    await handle();
    expect(state.auditEntries).toEqual([]);
  });

  it("ignores the end of an older subscription when a newer one is live", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ stripeSubscriptionId: "sub_new" }));
    state.stripe.subscriptions.set("sub_ramonage", aStripeSubscription({ status: "canceled" }));
    expect(await handle()).toBe("ignored");
    expect(stored()?.stripeSubscriptionId).toBe("sub_new");
  });

  it.each([
    ["a subscription unknown to Stripe", () => state.stripe.subscriptions.clear()],
    [
      "a subscription without company",
      () =>
        state.stripe.subscriptions.set(
          "sub_ramonage",
          aStripeSubscription({ organizationId: null }),
        ),
    ],
    ["a company that no longer exists", () => state.organizations.clear()],
    [
      "a price outside the catalog",
      () =>
        state.stripe.subscriptions.set("sub_ramonage", aStripeSubscription({ lookupKey: "other" })),
    ],
  ])("ignores %s", async (_case, arrange) => {
    arrange();
    expect(await handle()).toBe("ignored");
    expect(stored()).toBeUndefined();
  });

  it("ignores events while online payment is not configured", async () => {
    expect(await handle(anEvent(), false)).toBe("ignored");
    expect(state.processedEvents.size).toBe(0);
  });
});
