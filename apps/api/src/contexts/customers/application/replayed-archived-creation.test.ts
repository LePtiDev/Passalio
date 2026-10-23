import type { Actor, CustomerMutation } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { applyCustomerMutation } from "./apply-customer-mutation";

const CUSTOMER_ID = "0190f3a0-0000-7000-8001-000000000001";

const owner: Actor = {
  userId: "user-owner",
  organizationId: "organization-a",
  role: "owner",
  isImpersonating: false,
};

const creation: CustomerMutation = {
  type: "create_customer",
  customerId: CUSTOMER_ID,
  customer: { kind: "individual", lastName: "Lefèvre" },
};

describe("replayed creation of an archived customer", () => {
  it("accepts a replayed creation of a customer archived later in the same batch", async () => {
    const state = createInMemoryCustomerState();
    let clock = Date.parse("2026-10-22T10:00:00Z");
    const apply = applyCustomerMutation(
      createInMemoryCustomerDependencies(state, () => new Date((clock += 1000))),
    );
    expect((await apply(owner, creation)).isOk).toBe(true);
    expect((await apply(owner, { type: "archive_customer", customerId: CUSTOMER_ID })).isOk).toBe(
      true,
    );
    expect(await apply(owner, creation)).toEqual({ isOk: true, value: undefined });
    expect(state.customers).toHaveLength(1);
  });
});
