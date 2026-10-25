import { beforeEach, describe, expect, it } from "vitest";
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
import { checkWorkspaceAccess } from "./check-workspace-access";

let state: InMemoryBillingState;

const check = (now: Date, organizationId = ORGANIZATION_ID) =>
  checkWorkspaceAccess(createInMemoryBillingDependencies(state, () => now))(organizationId);

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
});

describe("checkWorkspaceAccess", () => {
  it("opens the workspace during the trial", async () => {
    expect((await check(DURING_TRIAL))?.state).toBe("trial");
  });

  it("blocks the workspace after the trial without a subscription", async () => {
    expect(await check(AFTER_TRIAL)).toMatchObject({
      state: "blocked",
      blockedReason: "trial_ended",
      blockedAt: new Date("2026-11-09T09:00:00.000Z"),
    });
  });

  it("opens the workspace of a subscribed company after the trial", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription());
    expect((await check(AFTER_TRIAL))?.state).toBe("active");
  });

  it("knows nothing of an unknown organization", async () => {
    expect(await check(AFTER_TRIAL, "organization-inconnue")).toBeUndefined();
  });
});
