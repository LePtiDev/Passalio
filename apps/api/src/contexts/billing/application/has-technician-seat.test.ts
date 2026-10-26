import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import { aSubscription, CREATED_AT, DURING_TRIAL, ORGANIZATION_ID } from "./billing.fixture";
import { hasTechnicianSeat } from "./has-technician-seat";

let state: InMemoryBillingState;

const check = (organizationId = ORGANIZATION_ID) =>
  hasTechnicianSeat(createInMemoryBillingDependencies(state, () => DURING_TRIAL))(organizationId);

beforeEach(() => {
  state = createInMemoryBillingState();
  state.organizations.set(ORGANIZATION_ID, CREATED_AT);
  state.technicianCounts.set(ORGANIZATION_ID, 1);
});

describe("hasTechnicianSeat", () => {
  it("lets a company in trial add technicians", async () => {
    expect(await check()).toBe(true);
  });

  it("lets an Équipe company add technicians", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "team" }));
    state.technicianCounts.set(ORGANIZATION_ID, 5);
    expect(await check()).toBe(true);
  });

  it("refuses a second technician to a Solo company", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo" }));
    expect(await check()).toBe(false);
  });

  it("counts a pending technician invitation as a taken seat", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo" }));
    state.technicianCounts.set(ORGANIZATION_ID, 0);
    state.pendingTechnicianInvitations.set(ORGANIZATION_ID, 1);
    expect(await check()).toBe(false);
  });

  it("leaves the seat open to a Solo company without any technician yet", async () => {
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo" }));
    state.technicianCounts.set(ORGANIZATION_ID, 0);
    expect(await check()).toBe(true);
  });

  it("reads the seats of the given company only", async () => {
    state.organizations.set("organization-b", CREATED_AT);
    state.subscriptions.set(ORGANIZATION_ID, aSubscription({ plan: "solo" }));
    expect(await check("organization-b")).toBe(true);
  });
});
