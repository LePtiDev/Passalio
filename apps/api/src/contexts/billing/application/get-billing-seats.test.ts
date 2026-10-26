import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryBillingDependencies,
  createInMemoryBillingState,
  type InMemoryBillingState,
} from "../infrastructure/in-memory-billing-dependencies";
import { DURING_TRIAL, ORGANIZATION_ID } from "./billing.fixture";
import { getBillingSeats } from "./get-billing-seats";

let state: InMemoryBillingState;

const read = (actor = organizationActorWith("owner")) =>
  getBillingSeats(createInMemoryBillingDependencies(state, () => DURING_TRIAL))(actor);

beforeEach(() => {
  state = createInMemoryBillingState();
});

describe("getBillingSeats", () => {
  it("gives the number of technicians and the name of the owner", async () => {
    state.technicianCounts.set(ORGANIZATION_ID, 2);
    state.ownerNames.set(ORGANIZATION_ID, "Jean Dupont");
    expect(await read()).toEqual({ technicianCount: 2, ownerName: "Jean Dupont" });
  });

  it.each(ORGANIZATION_ROLES)("lets the %s read it", async (role) => {
    state.ownerNames.set(ORGANIZATION_ID, "Jean Dupont");
    expect((await read(organizationActorWith(role))).ownerName).toBe("Jean Dupont");
  });

  it("reads only the company of the actor", async () => {
    state.technicianCounts.set("organization-b", 5);
    state.ownerNames.set("organization-b", "Autre patron");
    expect(await read()).toEqual({ technicianCount: 0, ownerName: null });
  });
});
