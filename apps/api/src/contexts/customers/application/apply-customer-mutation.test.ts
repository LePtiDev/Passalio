import type { CustomerMutation, OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { applyCustomerMutation } from "./apply-customer-mutation";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => applyCustomerMutation(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const site = {
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

describe("applyCustomerMutation", () => {
  it.each<readonly [string, CustomerMutation]>([
    [
      "create_customer",
      {
        type: "create_customer",
        customerId: "customer-new",
        customer: { kind: "individual", lastName: "Martin" },
      },
    ],
    [
      "update_customer",
      { type: "update_customer", customerId: "customer-a", changes: { phone: "01" } },
    ],
    ["add_site", { type: "add_site", customerId: "customer-a", siteId: "site-new", site }],
    ["update_site", { type: "update_site", siteId: "site-a", changes: { accessNotes: "Code" } }],
    [
      "add_equipment",
      {
        type: "add_equipment",
        siteId: "site-a",
        equipmentId: "equipment-new",
        equipment: { kind: "insert" },
      },
    ],
    [
      "update_equipment",
      { type: "update_equipment", equipmentId: "equipment-a", changes: { brand: "Atlantic" } },
    ],
    ["remove_equipment", { type: "remove_equipment", equipmentId: "equipment-a" }],
  ])("applies a %s from a technician", async (_, mutation) => {
    expect(await run()(technician, mutation)).toEqual({ isOk: true, value: undefined });
  });

  it("applies each change to the right record", async () => {
    await run()(technician, {
      type: "update_customer",
      customerId: "customer-a",
      changes: { phone: "0102030405" },
    });
    await run()(technician, {
      type: "update_site",
      siteId: "site-a",
      changes: { accessNotes: "Code 1234" },
    });
    await run()(technician, { type: "remove_equipment", equipmentId: "equipment-a" });
    expect(state.customers[0]?.phone).toBe("0102030405");
    expect(state.sites[0]?.accessNotes).toBe("Code 1234");
    expect(state.equipments[0]?.status).toBe("removed");
  });

  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "applies an archive_customer from a %s",
    async (role) => {
      expect(
        await run()(organizationActorWith(role), {
          type: "archive_customer",
          customerId: "customer-a",
        }),
      ).toEqual({ isOk: true, value: undefined });
      expect(state.archivedAt.has("customer-a")).toBe(true);
    },
  );

  it("rejects an archive_customer from a technician as forbidden", async () => {
    expect(await run()(technician, { type: "archive_customer", customerId: "customer-a" })).toEqual(
      { isOk: false, error: "forbidden" },
    );
    expect(state.archivedAt.size).toBe(0);
  });

  it("rejects every change during an impersonation as forbidden", async () => {
    expect(
      await run()(organizationActorWith("owner", { isImpersonating: true }), {
        type: "update_site",
        siteId: "site-a",
        changes: { accessNotes: "Code 1234" },
      }),
    ).toEqual({ isOk: false, error: "forbidden" });
    expect(state.sites[0]?.accessNotes).toBeNull();
  });

  it("accepts a replayed site or equipment creation without doing it twice", async () => {
    const addSite = {
      type: "add_site",
      customerId: "customer-a",
      siteId: "site-new",
      site,
    } as const;
    const addInsert = {
      type: "add_equipment",
      siteId: "site-new",
      equipmentId: "equipment-new",
      equipment: { kind: "insert" },
    } as const;
    await run()(technician, addSite);
    await run()(technician, addInsert);
    expect(await run()(technician, addSite)).toEqual({ isOk: true, value: undefined });
    expect(await run()(technician, addInsert)).toEqual({ isOk: true, value: undefined });
    expect(state.sites.filter(({ id }) => id === "site-new")).toHaveLength(1);
    expect(state.equipments.filter(({ id }) => id === "equipment-new")).toHaveLength(1);
  });

  it("rejects a creation that reuses an id of another organization instead of accepting it", async () => {
    expect(
      await run()(technician, {
        type: "create_customer",
        customerId: "customer-b",
        customer: { kind: "individual", lastName: "Martin" },
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(
      await run()(technician, {
        type: "add_site",
        customerId: "customer-a",
        siteId: "site-b",
        site,
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
  });

  it("passes on the business refusal of a change", async () => {
    expect(
      await run()(technician, {
        type: "update_customer",
        customerId: "customer-a",
        changes: { lastName: null },
      }),
    ).toEqual({ isOk: false, error: "customer_name_required" });
    expect(
      await run()(technician, {
        type: "update_site",
        siteId: "site-b",
        changes: { city: "Paris" },
      }),
    ).toEqual({ isOk: false, error: "site_not_found" });
  });

  it("accepts a replayed customer creation even after the customer was archived", async () => {
    const creation = {
      type: "create_customer",
      customerId: "customer-new",
      customer: { kind: "individual", lastName: "Martin" },
    } as const;
    await run()(technician, creation);
    await run()(organizationActorWith("secretary"), {
      type: "archive_customer",
      customerId: "customer-new",
    });
    expect(await run()(technician, creation)).toEqual({ isOk: true, value: undefined });
  });
});

describe("applyCustomerMutation, replays and concurrent changes", () => {
  const creation = {
    type: "create_customer",
    customerId: "customer-new",
    customer: { kind: "individual", lastName: "Martin" },
  } as const;

  it("accepts a replayed customer creation without creating it twice or changing it", async () => {
    await run()(technician, creation);
    await run()(technician, {
      type: "update_customer",
      customerId: "customer-new",
      changes: { phone: "0102030405" },
    });
    expect(await run()(technician, creation)).toEqual({ isOk: true, value: undefined });
    expect(state.customers.filter(({ id }) => id === "customer-new")).toHaveLength(1);
    expect(state.customers.find(({ id }) => id === "customer-new")?.phone).toBe("0102030405");
  });

  it("rejects an equipment creation that reuses an id of another organization", async () => {
    expect(
      await run()(technician, {
        type: "add_equipment",
        siteId: "site-a",
        equipmentId: "equipment-b",
        equipment: { kind: "insert" },
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(state.equipments.find(({ id }) => id === "equipment-b")?.organizationId).toBe(
      "organization-b",
    );
  });

  it("keeps both changes when two people change different fields of the same customer", async () => {
    await run()(technician, {
      type: "update_customer",
      customerId: "customer-a",
      changes: { phone: "0102030405" },
    });
    await run()(organizationActorWith("secretary"), {
      type: "update_customer",
      customerId: "customer-a",
      changes: { email: "lefevre@example.fr" },
    });
    expect(state.customers.find(({ id }) => id === "customer-a")).toMatchObject({
      phone: "0102030405",
      email: "lefevre@example.fr",
    });
  });

  it("keeps the last change received when two people change the same field", async () => {
    await run()(technician, {
      type: "update_site",
      siteId: "site-a",
      changes: { accessNotes: "Code 1234" },
    });
    await run()(organizationActorWith("secretary"), {
      type: "update_site",
      siteId: "site-a",
      changes: { accessNotes: "Code 5678" },
    });
    expect(state.sites.find(({ id }) => id === "site-a")?.accessNotes).toBe("Code 5678");
  });

  it.each<readonly [string, CustomerMutation]>([
    ["create_customer", creation],
    ["add_site", { type: "add_site", customerId: "customer-a", siteId: "site-new", site }],
    [
      "add_equipment",
      {
        type: "add_equipment",
        siteId: "site-a",
        equipmentId: "equipment-new",
        equipment: { kind: "insert" },
      },
    ],
    ["remove_equipment", { type: "remove_equipment", equipmentId: "equipment-a" }],
    ["archive_customer", { type: "archive_customer", customerId: "customer-a" }],
  ])(
    "rejects a %s during an impersonation as forbidden and changes nothing",
    async (_, mutation) => {
      expect(
        await run()(organizationActorWith("owner", { isImpersonating: true }), mutation),
      ).toEqual({ isOk: false, error: "forbidden" });
      expect(state.customers).toHaveLength(2);
      expect(state.sites).toHaveLength(2);
      expect(state.equipments.map(({ status }) => status)).toEqual(["active", "active"]);
      expect(state.archivedAt.size).toBe(0);
    },
  );

  it("does not apply a change to a customer of another organization", async () => {
    expect(
      await run()(technician, {
        type: "update_customer",
        customerId: "customer-b",
        changes: { phone: "0102030405" },
      }),
    ).toEqual({ isOk: false, error: "customer_not_found" });
    expect(state.customers.find(({ id }) => id === "customer-b")?.phone).toBeNull();
  });
});
