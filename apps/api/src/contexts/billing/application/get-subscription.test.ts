import { ORGANIZATION_ROLES, subscriptionResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import {
  AFTER_TRIAL,
  aSubscription,
  CREATED_AT,
  DURING_TRIAL,
  ORGANIZATION_ID,
} from "./billing.fixture";
import { getSubscription } from "./get-subscription";

let state: InMemoryBillingState;
let now: Date;

const read = (actor = organizationActorWith("owner"), isBillingEnabled = true) =>
  getSubscription(createInMemoryBillingDependencies(state, () => now, { isBillingEnabled }))(actor);

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  now = DURING_TRIAL;
});

describe("getSubscription", () => {
  it("shows a trial company the end of its 7 days, with no subscription", async () => {
    const response = await read();
    expect(subscriptionResponse.parse(response)).toEqual({
      workspaceState: "trial",
      blockedReason: null,
      trialEndsAt: "2026-11-09T09:00:00.000Z",
      graceEndsAt: null,
      isBillingEnabled: true,
      canManage: true,
      subscription: null,
    });
  });

  it("shows a blocked workspace once the trial has ended", async () => {
    now = AFTER_TRIAL;
    expect(await read()).toMatchObject({ workspaceState: "blocked", blockedReason: "trial_ended" });
  });

  it("shows the owner the plan, the period end and the payment method", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ isCancelScheduled: true }));
    now = AFTER_TRIAL;
    expect(await read()).toMatchObject({
      workspaceState: "active",
      subscription: {
        plan: "team",
        interval: "month",
        isFounder: false,
        currentPeriodEndsAt: "2026-12-20T12:00:00.000Z",
        isCancelScheduled: true,
        paymentMethod: { type: "card", last4: "4242" },
      },
    });
  });

  it.each(ORGANIZATION_ROLES.filter((role) => role !== "owner"))(
    "lets the %s see the state but not manage it nor see the payment method",
    async (role) => {
      state.subscriptions.set(ORGANIZATION_ID, aSubscription());
      const response = await read(organizationActorWith(role));
      expect(response?.canManage).toBe(false);
      expect(response?.subscription?.paymentMethod).toBeNull();
      expect(response?.workspaceState).toBe("active");
    },
  );

  it("hides the payment method from an impersonating superadmin", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    const response = await read(organizationActorWith("owner", { isImpersonating: true }));
    expect(response?.canManage).toBe(false);
    expect(response?.subscription?.paymentMethod).toBeNull();
  });

  it("says when online payment is not available yet", async () => {
    expect((await read(organizationActorWith("owner"), false))?.isBillingEnabled).toBe(false);
  });

  it("shows the end of the 15 days after a refused payment", async () => {
    state.subscriptions.set(
      ORGANIZATION_ID,
      aSubscription({ status: "past_due", paymentFailedAt: AFTER_TRIAL }),
    );
    now = AFTER_TRIAL;
    expect(await read()).toMatchObject({
      workspaceState: "payment_failed",
      graceEndsAt: "2026-12-05T12:00:00.000Z",
    });
  });

  it("returns nothing for an organization that no longer exists", async () => {
    state.organizations.clear();
    expect(await read()).toBeUndefined();
  });
});
