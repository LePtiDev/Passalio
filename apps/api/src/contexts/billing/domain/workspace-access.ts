import {
  paymentGraceEndOf,
  trialEndOf,
  type BlockedReason,
  type SubscriptionStatus,
  type WorkspaceState,
} from "@passalio/shared";

export type AccessSubscription = {
  readonly status: SubscriptionStatus;
  readonly paymentFailedAt: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly endedAt: Date | null;
  readonly updatedAt: Date;
};

export type WorkspaceAccess = {
  readonly state: WorkspaceState;
  readonly blockedReason: BlockedReason | null;
  readonly blockedAt: Date | null;
  readonly trialEndsAt: Date;
  readonly graceEndsAt: Date | null;
};

export type WorkspaceFacts = {
  readonly organizationCreatedAt: Date;
  readonly subscription: AccessSubscription | null;
  readonly now: Date;
};

const open = (state: WorkspaceState, trialEndsAt: Date, graceEndsAt: Date | null = null) => ({
  state,
  blockedReason: null,
  blockedAt: null,
  trialEndsAt,
  graceEndsAt,
});

const blocked = (
  blockedReason: BlockedReason,
  blockedAt: Date,
  trialEndsAt: Date,
  graceEndsAt: Date | null = null,
): WorkspaceAccess => ({
  state: "blocked",
  blockedReason,
  blockedAt,
  trialEndsAt,
  graceEndsAt,
});

const trialAccess = (trialEndsAt: Date, now: Date): WorkspaceAccess =>
  now < trialEndsAt ? open("trial", trialEndsAt) : blocked("trial_ended", trialEndsAt, trialEndsAt);

const paymentFailedAccess = (
  subscription: AccessSubscription,
  trialEndsAt: Date,
  now: Date,
): WorkspaceAccess => {
  const graceEndsAt = paymentGraceEndOf(subscription.paymentFailedAt ?? subscription.updatedAt);
  return now < graceEndsAt
    ? open("payment_failed", trialEndsAt, graceEndsAt)
    : blocked("unpaid", graceEndsAt, trialEndsAt, graceEndsAt);
};

export const workspaceAccessOf = ({
  organizationCreatedAt,
  subscription,
  now,
}: WorkspaceFacts): WorkspaceAccess => {
  const trialEndsAt = trialEndOf(organizationCreatedAt);
  if (subscription === null || subscription.status === "incomplete_expired") {
    return trialAccess(trialEndsAt, now);
  }
  const { status } = subscription;
  if (status === "active" || status === "trialing") {
    return open("active", trialEndsAt);
  }
  if (status === "incomplete") {
    return open("payment_pending", trialEndsAt);
  }
  if (status === "past_due" || status === "unpaid") {
    return paymentFailedAccess(subscription, trialEndsAt, now);
  }
  if (status === "paused") {
    return blocked("unpaid", subscription.updatedAt, trialEndsAt);
  }
  return now < trialEndsAt
    ? open("trial", trialEndsAt)
    : blocked(
        "canceled",
        subscription.endedAt ?? subscription.currentPeriodEnd ?? subscription.updatedAt,
        trialEndsAt,
      );
};

export const canWriteIn = (access: WorkspaceAccess): boolean => access.state !== "blocked";

export const isSignedBeforeBlock = (access: WorkspaceAccess, signedAt: Date): boolean =>
  access.blockedAt !== null && signedAt < access.blockedAt;
