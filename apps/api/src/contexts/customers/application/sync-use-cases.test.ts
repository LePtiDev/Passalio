import type { Actor, OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { applyCustomerMutation } from "./apply-customer-mutation";
import { pullCustomerChanges, SYNC_PAGE_SIZE } from "./pull-customer-changes";

const ORGANIZATION_ID = "organization-a";
const CUSTOMER_ID = "0190f3a0-0000-7000-8000-000000000001";

let state: InMemoryCustomerState;
let clock: number;
const dependencies = () =>
  createInMemoryCustomerDependencies(state, () => new Date((clock += 1000)));

const actor = (role: OrganizationRole = "technician", isImpersonating = false): Actor => ({
  userId: `user-${role}`,
  organizationId: ORGANIZATION_ID,
  role,
  isImpersonating,
});

beforeEach(() => {
  state = createInMemoryCustomerState();
  clock = Date.parse("2026-10-22T10:00:00Z");
});

describe("applyCustomerMutation", () => {
  const creation = {
    type: "create_customer" as const,
    customerId: CUSTOMER_ID,
    customer: { kind: "individual" as const, lastName: "Lefèvre" },
  };

  it("treats a replayed creation as applied", async () => {
    expect((await applyCustomerMutation(dependencies())(actor(), creation)).isOk).toBe(true);
    expect((await applyCustomerMutation(dependencies())(actor(), creation)).isOk).toBe(true);
    expect(state.customers).toHaveLength(1);
  });

  it("turns a missing permission into a rejection instead of an exception", async () => {
    await applyCustomerMutation(dependencies())(actor(), creation);
    expect(
      await applyCustomerMutation(dependencies())(actor("technician"), {
        type: "archive_customer",
        customerId: CUSTOMER_ID,
      }),
    ).toEqual({ isOk: false, error: "forbidden" });
    expect(await applyCustomerMutation(dependencies())(actor("owner", true), creation)).toEqual({
      isOk: false,
      error: "forbidden",
    });
  });
});

describe("pullCustomerChanges", () => {
  it("pages through changes with one cursor per table", async () => {
    await Promise.all(
      Array.from({ length: SYNC_PAGE_SIZE + 1 }, (_, index) =>
        applyCustomerMutation(dependencies())(actor(), {
          type: "create_customer",
          customerId: `0190f3a0-0000-7000-8000-${String(index).padStart(12, "0")}`,
          customer: { kind: "individual", lastName: `Client ${index}` },
        }),
      ),
    );
    const first = await pullCustomerChanges(dependencies())(actor(), {});
    expect(first.changes.customers).toHaveLength(SYNC_PAGE_SIZE);
    expect(first.hasMore).toBe(true);
    expect(first.cursors.sites).toBeUndefined();
    const second = await pullCustomerChanges(dependencies())(actor(), first.cursors);
    expect(second.changes.customers).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });
});
