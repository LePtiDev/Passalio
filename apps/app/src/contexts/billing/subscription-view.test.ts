import type { SubscriptionResponse } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import {
  billingBannerOf,
  formatCents,
  formatEuros,
  invoiceStateOf,
  isWorkspaceBlocked,
  paymentFailedAtOf,
  recommendedPlanOf,
  subscriptionAlertOf,
  subscriptionBadgeOf,
  subscriptionPriceOf,
  trialProgressOf,
} from "./subscription-view";

const NOW = new Date("2026-10-25T10:00:00.000Z");

const DETAILS = {
  plan: "solo",
  interval: "month",
  isFounder: false,
  currentPeriodEndsAt: "2026-11-24T10:00:00.000Z",
  isCancelScheduled: false,
  paymentMethod: { type: "card", last4: "4242" },
} as const;

const aResponse = (changes: Partial<SubscriptionResponse> = {}): SubscriptionResponse => ({
  workspaceState: "trial",
  blockedReason: null,
  trialEndsAt: "2026-10-28T10:00:00.000Z",
  graceEndsAt: null,
  isBillingEnabled: true,
  canManage: true,
  subscription: null,
  ...changes,
});

describe("prices of docs/stripe.md", () => {
  it.each([
    ["solo", "month", 29],
    ["solo", "year", 290],
    ["team", "month", 49],
    ["team", "year", 490],
  ] as const)("charges %s per %s %d € HT", (plan, interval, euros) => {
    expect(subscriptionPriceOf({ plan, interval, isFounder: false })).toBe(euros);
  });

  it("charges the founder offer 19 € HT per month", () => {
    expect(subscriptionPriceOf({ plan: "team", interval: "month", isFounder: true })).toBe(19);
  });

  it("writes amounts in French", () => {
    expect(formatEuros(29)).toBe("29,00 €");
    expect(formatCents(2900)).toBe("29,00 €");
  });
});

describe("trial progress", () => {
  it("counts the days left and used of the 7-day trial", () => {
    expect(trialProgressOf(new Date("2026-10-28T10:00:00.000Z"), NOW)).toEqual({
      daysLeft: 3,
      daysUsed: 4,
    });
  });

  it("never goes below zero nor above seven days", () => {
    expect(trialProgressOf(new Date("2026-10-20T10:00:00.000Z"), NOW).daysLeft).toBe(0);
    expect(trialProgressOf(new Date("2026-11-20T10:00:00.000Z"), NOW)).toEqual({
      daysLeft: 7,
      daysUsed: 0,
    });
  });
});

describe("recommended plan", () => {
  it.each([
    [0, "solo"],
    [1, "solo"],
    [2, "team"],
  ] as const)("recommends %s technicians the %s plan", (count, plan) => {
    expect(recommendedPlanOf(count)).toBe(plan);
  });
});

describe("subscription alert", () => {
  it("tells a member that only the owner manages the subscription", () => {
    expect(
      subscriptionAlertOf(aResponse({ canManage: false, workspaceState: "payment_failed" })),
    ).toBe("member");
  });

  it.each(["payment_pending", "payment_failed"] as const)("warns the owner about %s", (state) => {
    expect(subscriptionAlertOf(aResponse({ workspaceState: state, subscription: DETAILS }))).toBe(
      state,
    );
  });

  it("tells the owner when the subscription stops at the end of the period", () => {
    expect(
      subscriptionAlertOf(
        aResponse({
          workspaceState: "active",
          subscription: { ...DETAILS, isCancelScheduled: true },
        }),
      ),
    ).toBe("cancel_scheduled");
  });

  it("shows nothing for an active subscription", () => {
    expect(
      subscriptionAlertOf(aResponse({ workspaceState: "active", subscription: DETAILS })),
    ).toBeNull();
  });
});

describe("subscription badge", () => {
  it.each([
    ["active", false, "active"],
    ["active", true, "ending"],
    ["payment_pending", false, "payment_pending"],
    ["payment_failed", true, "payment_failed"],
  ] as const)("shows %s (cancel scheduled: %s) as %s", (state, isCancelScheduled, badge) => {
    expect(subscriptionBadgeOf(state, isCancelScheduled)).toBe(badge);
  });
});

describe("billing banner", () => {
  it("warns the owner 3 days before the end of the trial", () => {
    expect(billingBannerOf(aResponse(), NOW)).toEqual({ kind: "trial_ending", daysLeft: 3 });
  });

  it("stays quiet earlier in the trial", () => {
    expect(billingBannerOf(aResponse({ trialEndsAt: "2026-10-29T10:00:00.000Z" }), NOW)).toBeNull();
  });

  it("warns the owner of a refused payment until the end of the 15 days", () => {
    expect(
      billingBannerOf(
        aResponse({
          workspaceState: "payment_failed",
          graceEndsAt: "2026-12-09T10:00:00.000Z",
          subscription: DETAILS,
        }),
        NOW,
      ),
    ).toEqual({ kind: "payment_failed", graceEndsAt: new Date("2026-12-09T10:00:00.000Z") });
  });

  it.each([
    ["a member", aResponse({ canManage: false })],
    ["a company while online payment is closed", aResponse({ isBillingEnabled: false })],
    ["an active subscription", aResponse({ workspaceState: "active", subscription: DETAILS })],
  ])("shows nothing to %s", (_case, response) => {
    expect(billingBannerOf(response, NOW)).toBeNull();
  });
});

describe("blocked workspace", () => {
  it("blocks only when online payment is open", () => {
    expect(isWorkspaceBlocked({ isBillingEnabled: true, workspaceState: "blocked" })).toBe(true);
    expect(isWorkspaceBlocked({ isBillingEnabled: false, workspaceState: "blocked" })).toBe(false);
    expect(isWorkspaceBlocked({ isBillingEnabled: true, workspaceState: "payment_failed" })).toBe(
      false,
    );
  });

  it("finds the day of the refused payment, 15 days before the end of access", () => {
    expect(paymentFailedAtOf(new Date("2026-12-09T10:00:00.000Z"))).toEqual(
      new Date("2026-11-24T10:00:00.000Z"),
    );
  });
});

describe("invoice state", () => {
  it.each([
    ["paid", "active", "paid"],
    ["open", "payment_pending", "processing"],
    ["open", "payment_failed", "unpaid"],
    ["open", "active", "due"],
    ["uncollectible", "active", "unpaid"],
    ["void", "active", "void"],
  ] as const)("shows a %s invoice of a %s workspace as %s", (status, state, shown) => {
    expect(invoiceStateOf(status, state)).toBe(shown);
  });
});
