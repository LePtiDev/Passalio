import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { updateCustomer } from "./update-customer";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => updateCustomer(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const customerOf = (id: string) => state.customers.find((customer) => customer.id === id);

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("updateCustomer", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s update a customer", async (role) => {
    expect(
      await run()(organizationActorWith(role), {
        customerId: "customer-a",
        changes: { phone: "0607080910" },
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(customerOf("customer-a")?.phone).toBe("0607080910");
  });

  it("keeps the search name in line with a new name and dates the change", async () => {
    await run()(technician, {
      customerId: "customer-a",
      changes: { firstName: "Élodie", lastName: "Durand" },
    });
    expect(customerOf("customer-a")).toMatchObject({
      firstName: "Élodie",
      lastName: "Durand",
      searchName: "durand elodie",
      updatedAt: NOW,
    });
  });

  it("refuses to clear the last name of a person", async () => {
    expect(
      await run()(technician, { customerId: "customer-a", changes: { lastName: null } }),
    ).toEqual({ isOk: false, error: "customer_name_required" });
    expect(customerOf("customer-a")?.lastName).toBe("Lefèvre a");
  });

  it("refuses to turn a person into a company without a company name", async () => {
    expect(
      await run()(technician, { customerId: "customer-a", changes: { kind: "company" } }),
    ).toEqual({ isOk: false, error: "customer_name_required" });
  });

  it("records the reminder opt-out date once and clears it on opt-in", async () => {
    await run()(technician, {
      customerId: "customer-a",
      changes: { hasOptedOutOfReminders: true },
    });
    expect(customerOf("customer-a")?.remindersOptedOutAt).toEqual(NOW);
    await run()(technician, {
      customerId: "customer-a",
      changes: { hasOptedOutOfReminders: false },
    });
    expect(customerOf("customer-a")?.remindersOptedOutAt).toBeNull();
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        customerId: "customer-a",
        changes: { phone: "0607080910" },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(customerOf("customer-a")?.phone).toBeNull();
  });

  it("does not reach a customer of another organization", async () => {
    expect(
      await run()(technician, { customerId: "customer-b", changes: { phone: "0607080910" } }),
    ).toEqual({ isOk: false, error: "customer_not_found" });
    expect(customerOf("customer-b")?.phone).toBeNull();
  });

  it("does not update an archived customer", async () => {
    state.archivedAt.set("customer-a", NOW);
    expect(
      await run()(technician, { customerId: "customer-a", changes: { phone: "0607080910" } }),
    ).toEqual({ isOk: false, error: "customer_not_found" });
  });
});
