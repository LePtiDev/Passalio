import type { SubscriptionStatus } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import {
  canWriteIn,
  isSignedBeforeBlock,
  workspaceAccessOf,
  type AccessSubscription,
} from "./workspace-access";

const CREATED_AT = new Date("2026-11-02T09:00:00.000Z");
const TRIAL_END = new Date("2026-11-09T09:00:00.000Z");
const DURING_TRIAL = new Date("2026-11-05T12:00:00.000Z");
const AFTER_TRIAL = new Date("2026-11-20T12:00:00.000Z");
const PAYMENT_FAILED_AT = new Date("2026-12-09T09:00:00.000Z");
const GRACE_END = new Date("2026-12-24T09:00:00.000Z");
const PERIOD_END = new Date("2026-12-09T09:00:00.000Z");

const subscriptionWith = (
  status: SubscriptionStatus,
  changes: Partial<AccessSubscription> = {},
): AccessSubscription => ({
  status,
  paymentFailedAt: null,
  currentPeriodEnd: PERIOD_END,
  endedAt: null,
  updatedAt: new Date("2026-11-08T10:00:00.000Z"),
  ...changes,
});

const accessAt = (now: Date, subscription: AccessSubscription | null = null) =>
  workspaceAccessOf({ organizationCreatedAt: CREATED_AT, subscription, now });

describe("workspace access without a subscription", () => {
  it("is a trial during the first 7 days", () => {
    expect(accessAt(DURING_TRIAL)).toEqual({
      state: "trial",
      blockedReason: null,
      blockedAt: null,
      trialEndsAt: TRIAL_END,
      graceEndsAt: null,
    });
  });

  it("is still a trial one millisecond before the end of the 7 days", () => {
    expect(accessAt(new Date(TRIAL_END.getTime() - 1)).state).toBe("trial");
  });

  it("is blocked at the exact end of the trial, since the trial ended", () => {
    expect(accessAt(TRIAL_END)).toEqual({
      state: "blocked",
      blockedReason: "trial_ended",
      blockedAt: TRIAL_END,
      trialEndsAt: TRIAL_END,
      graceEndsAt: null,
    });
  });

  it("treats an expired first payment as no subscription", () => {
    expect(accessAt(AFTER_TRIAL, subscriptionWith("incomplete_expired")).blockedReason).toBe(
      "trial_ended",
    );
    expect(accessAt(DURING_TRIAL, subscriptionWith("incomplete_expired")).state).toBe("trial");
  });
});

describe("workspace access with a subscription", () => {
  it.each<SubscriptionStatus>(["active", "trialing"])(
    "is active when Stripe says %s, even after the trial",
    (status) => {
      expect(accessAt(AFTER_TRIAL, subscriptionWith(status))).toMatchObject({
        state: "active",
        blockedReason: null,
        graceEndsAt: null,
      });
    },
  );

  it("keeps the whole application while a SEPA payment is pending", () => {
    const access = accessAt(AFTER_TRIAL, subscriptionWith("incomplete"));
    expect(access.state).toBe("payment_pending");
    expect(canWriteIn(access)).toBe(true);
  });

  it.each<SubscriptionStatus>(["past_due", "unpaid"])(
    "gives 15 days after a refused payment when Stripe says %s",
    (status) => {
      const access = accessAt(
        new Date("2026-12-20T09:00:00.000Z"),
        subscriptionWith(status, { paymentFailedAt: PAYMENT_FAILED_AT }),
      );
      expect(access).toMatchObject({ state: "payment_failed", graceEndsAt: GRACE_END });
      expect(canWriteIn(access)).toBe(true);
    },
  );

  it("blocks the workspace as unpaid at the exact end of the 15 days", () => {
    expect(
      accessAt(GRACE_END, subscriptionWith("past_due", { paymentFailedAt: PAYMENT_FAILED_AT })),
    ).toEqual({
      state: "blocked",
      blockedReason: "unpaid",
      blockedAt: GRACE_END,
      trialEndsAt: TRIAL_END,
      graceEndsAt: GRACE_END,
    });
  });

  it("counts the 15 days from the last update when the failure date is unknown", () => {
    const updatedAt = new Date("2026-12-10T09:00:00.000Z");
    expect(accessAt(updatedAt, subscriptionWith("past_due", { updatedAt })).graceEndsAt).toEqual(
      new Date("2026-12-25T09:00:00.000Z"),
    );
  });

  it("blocks a paused subscription as unpaid", () => {
    expect(accessAt(AFTER_TRIAL, subscriptionWith("paused"))).toMatchObject({
      state: "blocked",
      blockedReason: "unpaid",
    });
  });

  it("blocks a canceled subscription from the end of the paid period", () => {
    const endedAt = new Date("2026-12-09T09:00:00.000Z");
    expect(
      accessAt(new Date("2026-12-15T09:00:00.000Z"), subscriptionWith("canceled", { endedAt })),
    ).toMatchObject({ state: "blocked", blockedReason: "canceled", blockedAt: endedAt });
  });

  it("falls back on the period end, then the last update, to date a cancellation", () => {
    const now = new Date("2026-12-15T09:00:00.000Z");
    expect(accessAt(now, subscriptionWith("canceled")).blockedAt).toEqual(PERIOD_END);
    const updatedAt = new Date("2026-11-30T09:00:00.000Z");
    expect(
      accessAt(now, subscriptionWith("canceled", { currentPeriodEnd: null, updatedAt })).blockedAt,
    ).toEqual(updatedAt);
  });

  it("keeps the trial when a subscription is canceled before the trial ends", () => {
    expect(accessAt(DURING_TRIAL, subscriptionWith("canceled")).state).toBe("trial");
  });
});

describe("writes in a workspace", () => {
  it.each([
    ["trial", DURING_TRIAL, null, true],
    ["blocked", AFTER_TRIAL, null, false],
    ["active", AFTER_TRIAL, subscriptionWith("active"), true],
  ] as const)("are allowed in a %s workspace: %s", (_state, now, subscription, expected) => {
    expect(canWriteIn(accessAt(now, subscription))).toBe(expected);
  });

  it("accept a certificate signed before the block, not after", () => {
    const access = accessAt(AFTER_TRIAL);
    expect(isSignedBeforeBlock(access, new Date(TRIAL_END.getTime() - 1))).toBe(true);
    expect(isSignedBeforeBlock(access, TRIAL_END)).toBe(false);
  });

  it("never treat a signature as before a block when the workspace is open", () => {
    expect(isSignedBeforeBlock(accessAt(DURING_TRIAL), CREATED_AT)).toBe(false);
  });
});
