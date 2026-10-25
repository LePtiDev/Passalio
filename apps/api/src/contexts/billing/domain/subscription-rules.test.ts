import type { SubscriptionStatus } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import type { Subscription } from "./billing-models";
import {
  hasLiveSubscription,
  isEndedStatus,
  isOutdatedSubscription,
  paymentFailedAtOf,
} from "./subscription-rules";

const AT = new Date("2026-12-01T10:00:00.000Z");
const FIRST_FAILURE = new Date("2026-11-28T10:00:00.000Z");

const subscriptionWith = (
  status: SubscriptionStatus,
  stripeSubscriptionId = "sub_1",
): Subscription => ({
  id: "subscription-1",
  organizationId: "organization-1",
  plan: "solo",
  interval: "month",
  isFounder: false,
  status,
  stripeCustomerId: "cus_1",
  stripeSubscriptionId,
  currentPeriodEnd: null,
  isCancelScheduled: false,
  endedAt: null,
  paymentFailedAt: null,
  paymentMethod: null,
  createdAt: AT,
  updatedAt: AT,
});

describe("live subscription", () => {
  it("is missing when there is no subscription", () => {
    expect(hasLiveSubscription(null)).toBe(false);
  });

  it.each<[SubscriptionStatus, boolean]>([
    ["active", true],
    ["trialing", true],
    ["incomplete", true],
    ["past_due", true],
    ["unpaid", true],
    ["paused", true],
    ["canceled", false],
    ["incomplete_expired", false],
  ])("is live when Stripe says %s: %s", (status, expected) => {
    expect(hasLiveSubscription(subscriptionWith(status))).toBe(expected);
    expect(isEndedStatus(status)).toBe(!expected);
  });
});

describe("date of the payment failure", () => {
  it.each<SubscriptionStatus>(["past_due", "unpaid"])(
    "starts at the first refused payment when Stripe says %s",
    (status) => {
      expect(paymentFailedAtOf(status, null, AT)).toEqual(AT);
    },
  );

  it("keeps the first failure when payments keep failing", () => {
    expect(paymentFailedAtOf("past_due", FIRST_FAILURE, AT)).toEqual(FIRST_FAILURE);
  });

  it.each<SubscriptionStatus>(["active", "canceled", "incomplete"])(
    "is cleared when Stripe says %s",
    (status) => {
      expect(paymentFailedAtOf(status, FIRST_FAILURE, AT)).toBeNull();
    },
  );
});

describe("outdated subscription events", () => {
  it("ignores the end of an older subscription when a newer one is live", () => {
    expect(isOutdatedSubscription(subscriptionWith("active", "sub_new"), "sub_old", true)).toBe(
      true,
    );
  });

  it("accepts a new subscription that replaces a canceled one", () => {
    expect(isOutdatedSubscription(subscriptionWith("canceled", "sub_old"), "sub_new", false)).toBe(
      false,
    );
  });

  it("accepts the end of the current subscription", () => {
    expect(isOutdatedSubscription(subscriptionWith("active", "sub_1"), "sub_1", true)).toBe(false);
  });

  it("accepts the first subscription of a company", () => {
    expect(isOutdatedSubscription(null, "sub_1", true)).toBe(false);
  });
});
