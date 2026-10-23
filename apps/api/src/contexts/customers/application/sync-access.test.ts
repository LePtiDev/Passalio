import { ORGANIZATION_ROLES, type Actor, type CustomerMutation } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { applyCustomerMutation } from "./apply-customer-mutation";
import { pullCustomerChanges } from "./pull-customer-changes";

const ORGANIZATION_A = "organization-a";
const ORGANIZATION_B = "organization-b";

const uuidOf = (index: number) => `0190f3a0-0000-7000-8020-${String(index).padStart(12, "0")}`;

const CUSTOMER_ID = uuidOf(1);
const SITE_ID = uuidOf(2);
const EQUIPMENT_ID = uuidOf(3);

const actorOf = (
  role: Actor["role"],
  organizationId = ORGANIZATION_A,
  isImpersonating = false,
): Actor => ({ userId: `user-${role}-${organizationId}`, organizationId, role, isImpersonating });

const SEED_CREATION: CustomerMutation = {
  type: "create_customer",
  customerId: CUSTOMER_ID,
  customer: { kind: "individual", lastName: "Lefèvre" },
};

const seed: readonly CustomerMutation[] = [
  SEED_CREATION,
  {
    type: "add_site",
    siteId: SITE_ID,
    customerId: CUSTOMER_ID,
    site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
  },
  {
    type: "add_equipment",
    equipmentId: EQUIPMENT_ID,
    siteId: SITE_ID,
    equipment: { kind: "insert" },
  },
];

const EVERY_MUTATION: readonly CustomerMutation[] = [
  {
    type: "create_customer",
    customerId: uuidOf(10),
    customer: { kind: "individual", lastName: "Nouveau" },
  },
  { type: "update_customer", customerId: CUSTOMER_ID, changes: { lastName: "Modifié" } },
  { type: "archive_customer", customerId: CUSTOMER_ID },
  {
    type: "add_site",
    siteId: uuidOf(11),
    customerId: CUSTOMER_ID,
    site: { address: "2 rue B", postalCode: "94200", city: "Ivry", buildingType: "house" },
  },
  { type: "update_site", siteId: SITE_ID, changes: { city: "Vitry" } },
  {
    type: "add_equipment",
    equipmentId: uuidOf(12),
    siteId: SITE_ID,
    equipment: { kind: "insert" },
  },
  { type: "update_equipment", equipmentId: EQUIPMENT_ID, changes: { brand: "Supra" } },
  { type: "remove_equipment", equipmentId: EQUIPMENT_ID },
];

const NOT_FOUND_IN_ANOTHER_ORGANIZATION: Readonly<Record<CustomerMutation["type"], string>> = {
  create_customer: "",
  update_customer: "customer_not_found",
  archive_customer: "customer_not_found",
  add_site: "customer_not_found",
  update_site: "site_not_found",
  add_equipment: "site_not_found",
  update_equipment: "equipment_not_found",
  remove_equipment: "equipment_not_found",
};

const seededState = async () => {
  const state = createInMemoryCustomerState();
  state.trades.set(ORGANIZATION_A, ["chimney_sweeping"]);
  state.trades.set(ORGANIZATION_B, ["chimney_sweeping"]);
  let clock = Date.parse("2026-10-22T10:00:00Z");
  const apply = applyCustomerMutation(
    createInMemoryCustomerDependencies(state, () => new Date((clock += 1000))),
  );
  await seed.reduce<Promise<unknown>>(async (previous, mutation) => {
    await previous;
    return apply(actorOf("owner"), mutation);
  }, Promise.resolve());
  return { state, apply };
};

const snapshotOf = (state: InMemoryCustomerState) =>
  JSON.stringify({
    customers: state.customers,
    sites: state.sites,
    equipments: state.equipments,
    archived: [...state.archivedAt.keys()],
  });

const roleCases = ORGANIZATION_ROLES.flatMap((role) =>
  EVERY_MUTATION.map((mutation) => [role, mutation.type, mutation] as const),
);

describe("pushed mutation permissions per role", () => {
  it.each(roleCases)("applies or refuses for %s a pushed %s", async (role, type, mutation) => {
    const { apply } = await seededState();
    const isRefused = role === "technician" && type === "archive_customer";
    expect(await apply(actorOf(role), mutation)).toEqual(
      isRefused ? { isOk: false, error: "forbidden" } : { isOk: true, value: undefined },
    );
  });
});

describe("pushed mutations during an impersonation", () => {
  it.each(roleCases)(
    "refuses for an impersonated %s a pushed %s and changes nothing",
    async (role, _, mutation) => {
      const { state, apply } = await seededState();
      const before = snapshotOf(state);
      expect(await apply(actorOf(role, ORGANIZATION_A, true), mutation)).toEqual({
        isOk: false,
        error: "forbidden",
      });
      expect(snapshotOf(state)).toBe(before);
    },
  );

  it("refuses a replayed creation during an impersonation instead of reporting it applied", async () => {
    const { apply } = await seededState();
    expect(await apply(actorOf("owner", ORGANIZATION_A, true), SEED_CREATION)).toEqual({
      isOk: false,
      error: "forbidden",
    });
  });

  it("still lets an impersonated member pull the organization data", async () => {
    const { state } = await seededState();
    const page = await pullCustomerChanges(createInMemoryCustomerDependencies(state))(
      actorOf("technician", ORGANIZATION_A, true),
      {},
    );
    expect(page.changes.customers.map(({ id }) => id)).toEqual([CUSTOMER_ID]);
  });
});

describe("pushed mutations from another organization", () => {
  it.each(EVERY_MUTATION.filter(({ type }) => type !== "create_customer"))(
    "refuses a pushed $type that targets another organization's record and changes nothing",
    async (mutation) => {
      const { state, apply } = await seededState();
      const before = snapshotOf(state);
      expect(await apply(actorOf("owner", ORGANIZATION_B), mutation)).toEqual({
        isOk: false,
        error: NOT_FOUND_IN_ANOTHER_ORGANIZATION[mutation.type],
      });
      expect(snapshotOf(state)).toBe(before);
    },
  );

  it.each(seed)(
    "does not report as applied a $type that reuses the id of another organization's record",
    async (mutation) => {
      const { state, apply } = await seededState();
      const before = snapshotOf(state);
      expect((await apply(actorOf("owner", ORGANIZATION_B), mutation)).isOk).toBe(false);
      expect(snapshotOf(state)).toBe(before);
    },
  );

  it("pulls nothing of another organization, even from its cursor", async () => {
    const { state } = await seededState();
    const pull = pullCustomerChanges(createInMemoryCustomerDependencies(state));
    const fromA = await pull(actorOf("owner"), {});
    const fromScratch = await pull(actorOf("owner", ORGANIZATION_B), {});
    const fromCursorOfA = await pull(actorOf("owner", ORGANIZATION_B), {
      customers: { updatedAt: new Date(0), id: "" },
    });
    expect(fromA.changes.customers).toHaveLength(1);
    expect(fromScratch.changes).toEqual({ customers: [], sites: [], equipments: [], photos: [] });
    expect(fromCursorOfA.changes.customers).toEqual([]);
  });
});
