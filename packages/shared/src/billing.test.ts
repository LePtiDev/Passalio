import { describe, expect, it } from "vitest";
import {
  PAYMENT_GRACE_DAYS,
  paymentGraceEndOf,
  startCheckoutBody,
  subscriptionResponse,
  TRIAL_DAYS,
  trialEndOf,
} from "./billing";

describe("billing durations of ADR 0025", () => {
  it("gives a 7-day trial from the creation of the company", () => {
    expect(TRIAL_DAYS).toBe(7);
    expect(trialEndOf(new Date("2026-11-02T09:00:00.000Z"))).toEqual(
      new Date("2026-11-09T09:00:00.000Z"),
    );
  });

  it("gives 15 days after a refused payment", () => {
    expect(PAYMENT_GRACE_DAYS).toBe(15);
    expect(paymentGraceEndOf(new Date("2026-12-20T10:00:00.000Z"))).toEqual(
      new Date("2027-01-04T10:00:00.000Z"),
    );
  });
});

describe("billing schemas", () => {
  it.each([
    { plan: "solo", interval: "month" },
    { plan: "solo", interval: "year" },
    { plan: "team", interval: "month" },
    { plan: "team", interval: "year" },
  ])("accepts the checkout of $plan per $interval", (body) => {
    expect(startCheckoutBody.parse(body)).toEqual(body);
  });

  it.each([{ plan: "founder", interval: "month" }, { plan: "team", interval: "week" }, {}])(
    "refuses the checkout body %o, since the founder offer is not chosen by the customer",
    (body) => {
      expect(startCheckoutBody.safeParse(body).success).toBe(false);
    },
  );

  it("describes a blocked workspace without subscription", () => {
    expect(
      subscriptionResponse.safeParse({
        workspaceState: "blocked",
        blockedReason: "trial_ended",
        trialEndsAt: "2026-11-09T09:00:00.000Z",
        graceEndsAt: null,
        isBillingEnabled: true,
        canManage: true,
        subscription: null,
      }).success,
    ).toBe(true);
  });
});
