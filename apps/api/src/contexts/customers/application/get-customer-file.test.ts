import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { inMemorySite, seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { getCustomerFile } from "./get-customer-file";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
let seeded: ReturnType<typeof seedCustomerOf>;
const run = () => getCustomerFile(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");

beforeEach(() => {
  state = createInMemoryCustomerState();
  seeded = seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-a", "other");
  seedCustomerOf(state, "organization-b", "b");
});

describe("getCustomerFile", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s open a customer file", async (role) => {
    expect((await run()(organizationActorWith(role), { customerId: "customer-a" })).isOk).toBe(
      true,
    );
  });

  it("stays readable during an impersonation", async () => {
    const result = await run()(organizationActorWith("owner", { isImpersonating: true }), {
      customerId: "customer-a",
    });
    expect(result.isOk).toBe(true);
  });

  it("gives the customer with only its own sites, equipments and photos, never the photo storage key", async () => {
    const { storageKey: _storageKey, ...visiblePhoto } = seeded.photo;
    expect(await run()(technician, { customerId: "customer-a" })).toEqual({
      isOk: true,
      value: {
        customer: seeded.customer,
        sites: [seeded.site],
        equipments: [seeded.equipment],
        photos: [visiblePhoto],
      },
    });
  });

  it("gives an empty file for a customer without site", async () => {
    state.customers.push({ ...seeded.customer, id: "customer-empty" });
    expect(await run()(technician, { customerId: "customer-empty" })).toEqual({
      isOk: true,
      value: {
        customer: { ...seeded.customer, id: "customer-empty" },
        sites: [],
        equipments: [],
        photos: [],
      },
    });
  });

  it("leaves out an archived site", async () => {
    state.sites.push(
      inMemorySite({
        id: "site-archived",
        organizationId: "organization-a",
        customerId: "customer-a",
      }),
    );
    state.archivedAt.set("site-archived", NOW);
    const result = await run()(technician, { customerId: "customer-a" });
    expect(result.isOk && result.value.sites.map(({ id }) => id)).toEqual(["site-a"]);
  });

  it("does not open a customer of another organization", async () => {
    expect(await run()(technician, { customerId: "customer-b" })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
  });

  it("does not open an archived customer", async () => {
    state.archivedAt.set("customer-a", NOW);
    expect(await run()(technician, { customerId: "customer-a" })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
  });
});
