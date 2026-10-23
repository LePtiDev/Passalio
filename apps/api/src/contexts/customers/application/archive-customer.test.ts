import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { archiveCustomer } from "./archive-customer";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => archiveCustomer(createInMemoryCustomerDependencies(state, () => NOW));
const secretary = organizationActorWith("secretary");

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("archiveCustomer", () => {
  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "lets a %s archive a customer",
    async (role) => {
      expect(await run()(organizationActorWith(role), { customerId: "customer-a" })).toEqual({
        isOk: true,
        value: undefined,
      });
      expect(state.archivedAt.get("customer-a")).toEqual(NOW);
    },
  );

  it("refuses a technician", async () => {
    await expect(
      run()(organizationActorWith("technician"), { customerId: "customer-a" }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.archivedAt.size).toBe(0);
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        customerId: "customer-a",
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.archivedAt.size).toBe(0);
  });

  it("archives the sites, equipments and photos of the customer with it", async () => {
    await run()(secretary, { customerId: "customer-a" });
    expect([...state.archivedAt.keys()].toSorted()).toEqual([
      "customer-a",
      "equipment-a",
      "photo-a",
      "site-a",
    ]);
  });

  it("does not archive a customer of another organization", async () => {
    expect(await run()(secretary, { customerId: "customer-b" })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
    expect(state.archivedAt.size).toBe(0);
  });

  it("answers not found for a customer already archived", async () => {
    await run()(secretary, { customerId: "customer-a" });
    expect(await run()(secretary, { customerId: "customer-a" })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
  });
});
