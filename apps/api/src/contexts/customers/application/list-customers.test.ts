import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { inMemoryCustomer } from "../infrastructure/in-memory-customer-fixtures";
import { CUSTOMERS_PAGE_SIZE, listCustomers } from "./list-customers";

let state: InMemoryCustomerState;
const run = () => listCustomers(createInMemoryCustomerDependencies(state));
const technician = organizationActorWith("technician");

const addCustomer = (id: string, searchName: string, organizationId = "organization-a") =>
  state.customers.push(inMemoryCustomer({ id, organizationId, lastName: searchName, searchName }));

beforeEach(() => {
  state = createInMemoryCustomerState();
});

describe("listCustomers", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s list the customers", async (role) => {
    addCustomer("customer-1", "lefevre");
    const page = await run()(organizationActorWith(role), {});
    expect(page.customers.map(({ id }) => id)).toEqual(["customer-1"]);
  });

  it("stays readable during an impersonation", async () => {
    addCustomer("customer-1", "lefevre");
    const page = await run()(organizationActorWith("owner", { isImpersonating: true }), {});
    expect(page.customers).toHaveLength(1);
  });

  it("answers an empty page when there is no customer", async () => {
    expect(await run()(technician, {})).toEqual({ customers: [], nextCursor: null });
  });

  it("lists only the customers of the actor's organization that are not archived", async () => {
    addCustomer("customer-a", "lefevre");
    addCustomer("customer-archived", "martin");
    addCustomer("customer-b", "dupont", "organization-b");
    state.archivedAt.set("customer-archived", new Date("2026-10-23T10:00:00Z"));
    const page = await run()(technician, {});
    expect(page.customers.map(({ id }) => id)).toEqual(["customer-a"]);
  });

  it("shows a summary without the search name", async () => {
    addCustomer("customer-1", "lefevre");
    const [customer] = (await run()(technician, {})).customers;
    expect(customer).toEqual({
      id: "customer-1",
      kind: "individual",
      firstName: null,
      lastName: "lefevre",
      companyName: null,
      phone: null,
      email: null,
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("finds customers by name prefix, without accents or case", async () => {
    addCustomer("customer-1", "lefevre elodie");
    addCustomer("customer-2", "lefort jean");
    addCustomer("customer-3", "martin paul");
    expect((await run()(technician, { query: "LEF" })).customers.map(({ id }) => id)).toEqual([
      "customer-1",
      "customer-2",
    ]);
    expect((await run()(technician, { query: "Lefè" })).customers.map(({ id }) => id)).toEqual([
      "customer-1",
    ]);
    expect((await run()(technician, { query: "zz" })).customers).toEqual([]);
  });

  it("lists everyone for a blank query", async () => {
    addCustomer("customer-1", "lefevre");
    addCustomer("customer-2", "martin");
    expect((await run()(technician, { query: "  " })).customers).toHaveLength(2);
  });

  it("walks through 50 customers per page without gap or duplicate", async () => {
    expect(CUSTOMERS_PAGE_SIZE).toBe(50);
    Array.from({ length: CUSTOMERS_PAGE_SIZE + 2 }, (_, index) =>
      addCustomer(
        `customer-${String(index).padStart(3, "0")}`,
        `client ${String(index).padStart(3, "0")}`,
      ),
    );
    const first = await run()(technician, {});
    const second = await run()(technician, { cursor: first.nextCursor ?? undefined });
    expect(first.customers).toHaveLength(50);
    expect(second.customers.map(({ id }) => id)).toEqual(["customer-050", "customer-051"]);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.customers, ...second.customers].map(({ id }) => id)).size).toBe(52);
  });

  it("gives no next cursor when the page is exactly full", async () => {
    Array.from({ length: CUSTOMERS_PAGE_SIZE }, (_, index) =>
      addCustomer(
        `customer-${String(index).padStart(3, "0")}`,
        `client ${String(index).padStart(3, "0")}`,
      ),
    );
    expect((await run()(technician, {})).nextCursor).toBeNull();
  });

  it("starts from the first page when the cursor is not readable", async () => {
    addCustomer("customer-1", "lefevre");
    expect((await run()(technician, { cursor: "garbage" })).customers).toHaveLength(1);
  });
});
