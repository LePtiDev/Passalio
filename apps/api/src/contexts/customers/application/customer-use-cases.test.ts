import { ForbiddenError, type Actor, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { archiveCustomer } from "./archive-customer";
import { createCustomer } from "./create-customer";
import { getCustomerFile } from "./get-customer-file";
import { CUSTOMERS_PAGE_SIZE, listCustomers } from "./list-customers";
import { updateCustomer } from "./update-customer";

const ORGANIZATION_ID = "organization-a";
const NOW = new Date("2026-10-22T10:00:00Z");

let state: InMemoryCustomerState;
const dependencies = () => createInMemoryCustomerDependencies(state, () => NOW);

const actor = (
  role: OrganizationRole,
  isImpersonating = false,
  organizationId = ORGANIZATION_ID,
): Actor => ({
  userId: `user-${role}`,
  organizationId,
  role,
  isImpersonating,
});

const site = {
  address: "12 rue Paul Bert",
  postalCode: "94200",
  city: "Ivry-sur-Seine",
  buildingType: "house" as const,
};

const create = (lastName: string, as: Actor = actor("technician")) =>
  createCustomer(dependencies())(as, {
    customer: { kind: "individual", firstName: "Jean", lastName },
    site,
  });

beforeEach(() => {
  state = createInMemoryCustomerState();
});

describe("createCustomer", () => {
  it("lets a technician create a customer with a first site", async () => {
    const result = await create("Lefèvre");
    expect(result.isOk && result.value.customer).toMatchObject({
      organizationId: ORGANIZATION_ID,
      searchName: "lefevre jean",
      createdByUserId: "user-technician",
    });
    expect(state.sites).toHaveLength(1);
  });

  it("accepts an id chosen offline and refuses to reuse it", async () => {
    const id = "0190f3a0-0000-7000-8000-000000000001";
    const input = { id, customer: { kind: "individual" as const, lastName: "Martin" } };
    expect((await createCustomer(dependencies())(actor("owner"), input)).isOk).toBe(true);
    expect(await createCustomer(dependencies())(actor("owner"), input)).toEqual({
      isOk: false,
      error: "already_exists",
    });
  });

  it("requires a name", async () => {
    const result = await createCustomer(dependencies())(actor("owner"), {
      customer: { kind: "company" },
    });
    expect(result).toEqual({ isOk: false, error: "customer_name_required" });
  });

  it("refuses writes during an impersonation", async () => {
    await expect(create("Lefèvre", actor("owner", true))).rejects.toThrow(ForbiddenError);
  });
});

describe("updateCustomer", () => {
  it("updates the search name and records the reminder opt-out", async () => {
    const created = await create("Lefèvre");
    const customerId = created.isOk ? created.value.customer.id : "";
    const result = await updateCustomer(dependencies())(actor("secretary"), {
      customerId,
      changes: { lastName: "Durand", hasOptedOutOfReminders: true, phone: undefined },
    });
    expect(result.isOk).toBe(true);
    expect(state.customers[0]).toMatchObject({
      lastName: "Durand",
      searchName: "durand jean",
      remindersOptedOutAt: NOW,
    });
  });

  it("does not see a customer of another organization", async () => {
    const created = await create("Lefèvre");
    const customerId = created.isOk ? created.value.customer.id : "";
    const result = await updateCustomer(dependencies())(actor("owner", false, "organization-b"), {
      customerId,
      changes: { lastName: "Pirate" },
    });
    expect(result).toEqual({ isOk: false, error: "customer_not_found" });
  });
});

describe("listCustomers", () => {
  it("searches by name prefix without accents", async () => {
    await create("Lefèvre");
    await create("Martin");
    const page = await listCustomers(dependencies())(actor("technician"), { query: "LEFE" });
    expect(page.customers.map(({ lastName }) => lastName)).toEqual(["Lefèvre"]);
  });

  it("paginates with a cursor", async () => {
    await Promise.all(
      Array.from({ length: CUSTOMERS_PAGE_SIZE + 2 }, (_, index) =>
        create(`Client ${String(index).padStart(3, "0")}`),
      ),
    );
    const first = await listCustomers(dependencies())(actor("technician"), {});
    const second = await listCustomers(dependencies())(actor("technician"), {
      cursor: first.nextCursor ?? "",
    });
    expect(first.customers).toHaveLength(CUSTOMERS_PAGE_SIZE);
    expect(second.customers).toHaveLength(2);
    expect(second.nextCursor).toBeNull();
  });
});

describe("archiveCustomer", () => {
  it("is refused to a technician", async () => {
    const created = await create("Lefèvre");
    const customerId = created.isOk ? created.value.customer.id : "";
    await expect(
      archiveCustomer(dependencies())(actor("technician"), { customerId }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("hides the customer and its sites for the secretary", async () => {
    const created = await create("Lefèvre");
    const customerId = created.isOk ? created.value.customer.id : "";
    expect((await archiveCustomer(dependencies())(actor("secretary"), { customerId })).isOk).toBe(
      true,
    );
    expect(await getCustomerFile(dependencies())(actor("owner"), { customerId })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
    expect(state.archivedAt.size).toBe(2);
  });
});
