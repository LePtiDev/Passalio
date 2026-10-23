import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { addSite } from "./add-site";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => addSite(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const fields = {
  label: "Résidence secondaire",
  address: "3 chemin des Vignes",
  postalCode: "89000",
  city: "Auxerre",
  buildingType: "house",
} as const;

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("addSite", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s add a site to a customer", async (role) => {
    const result = await run()(organizationActorWith(role), {
      customerId: "customer-a",
      site: fields,
    });
    expect(result.isOk).toBe(true);
    expect(state.sites.filter(({ customerId }) => customerId === "customer-a")).toHaveLength(2);
  });

  it("stores the site in the organization of the actor, under the customer, with the id chosen offline", async () => {
    const result = await run()(technician, {
      id: "site-offline",
      customerId: "customer-a",
      site: fields,
    });
    const expected = {
      id: "site-offline",
      organizationId: "organization-a",
      customerId: "customer-a",
      label: "Résidence secondaire",
      address: "3 chemin des Vignes",
      addressDetails: null,
      postalCode: "89000",
      city: "Auxerre",
      buildingType: "house",
      latitude: null,
      longitude: null,
      occupantName: null,
      occupantPhone: null,
      accessNotes: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(result).toEqual({ isOk: true, value: expected });
    expect(state.sites.at(-1)).toEqual(expected);
  });

  it("refuses to reuse an id already taken", async () => {
    expect(
      await run()(technician, { id: "site-b", customerId: "customer-a", site: fields }),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(state.sites).toHaveLength(2);
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        customerId: "customer-a",
        site: fields,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.sites).toHaveLength(2);
  });

  it("does not add a site to a customer of another organization", async () => {
    expect(await run()(technician, { customerId: "customer-b", site: fields })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
    expect(state.sites).toHaveLength(2);
  });

  it("does not add a site to an archived customer", async () => {
    state.archivedAt.set("customer-a", NOW);
    expect(await run()(technician, { customerId: "customer-a", site: fields })).toEqual({
      isOk: false,
      error: "customer_not_found",
    });
  });
});
