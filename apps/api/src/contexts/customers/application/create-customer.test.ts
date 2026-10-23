import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { createCustomer } from "./create-customer";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => createCustomer(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const site = {
  address: "12 rue Paul Bert",
  postalCode: "94200",
  city: "Ivry-sur-Seine",
  buildingType: "house",
} as const;

beforeEach(() => {
  state = createInMemoryCustomerState();
});

describe("createCustomer", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s create a customer", async (role) => {
    const result = await run()(organizationActorWith(role), {
      customer: { kind: "individual", lastName: "Lefèvre" },
    });
    expect(result.isOk && result.value.customer.createdByUserId).toBe(`user-${role}`);
  });

  it("creates a company customer, searchable by its company name, in the organization of the actor", async () => {
    const result = await run()(technician, {
      id: "customer-1",
      customer: { kind: "company", companyName: "Boulangerie Ménard", phone: "0102030405" },
    });
    expect(result).toEqual({
      isOk: true,
      value: {
        customer: {
          id: "customer-1",
          organizationId: "organization-a",
          kind: "company",
          civility: null,
          firstName: null,
          lastName: null,
          companyName: "Boulangerie Ménard",
          searchName: "boulangerie menard",
          email: null,
          phone: "0102030405",
          secondaryPhone: null,
          billingAddress: null,
          billingPostalCode: null,
          billingCity: null,
          notes: null,
          remindersOptedOutAt: null,
          createdByUserId: "user-technician",
          createdAt: NOW,
          updatedAt: NOW,
        },
        site: null,
      },
    });
    expect(state.sites).toEqual([]);
  });

  it("creates the first site with the id chosen offline", async () => {
    const result = await run()(technician, {
      id: "customer-1",
      customer: { kind: "individual", lastName: "Lefèvre" },
      site: { ...site, id: "site-1" },
    });
    expect(result.isOk && result.value.site).toMatchObject({
      id: "site-1",
      organizationId: "organization-a",
      customerId: "customer-1",
      city: "Ivry-sur-Seine",
    });
    expect(state.sites.map(({ id }) => id)).toEqual(["site-1"]);
  });

  it("records the reminder opt-out at creation", async () => {
    const result = await run()(technician, {
      customer: { kind: "individual", lastName: "Lefèvre", hasOptedOutOfReminders: true },
    });
    expect(result.isOk && result.value.customer.remindersOptedOutAt).toEqual(NOW);
  });

  it("refuses a company without a company name", async () => {
    expect(await run()(technician, { customer: { kind: "company", lastName: "Ménard" } })).toEqual({
      isOk: false,
      error: "customer_name_required",
    });
    expect(state.customers).toEqual([]);
  });

  it("refuses a site id already taken, even by another organization", async () => {
    seedCustomerOf(state, "organization-b", "b");
    expect(
      await run()(technician, {
        id: "customer-1",
        customer: { kind: "individual", lastName: "Lefèvre" },
        site: { ...site, id: "site-b" },
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(state.customers.map(({ id }) => id)).toEqual(["customer-b"]);
  });

  it("refuses a customer id already taken by another organization", async () => {
    seedCustomerOf(state, "organization-b", "b");
    expect(
      await run()(technician, {
        id: "customer-b",
        customer: { kind: "individual", lastName: "Lefèvre" },
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(state.customers.find(({ id }) => id === "customer-b")?.organizationId).toBe(
      "organization-b",
    );
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        customer: { kind: "individual", lastName: "Lefèvre" },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.customers).toEqual([]);
  });
});
