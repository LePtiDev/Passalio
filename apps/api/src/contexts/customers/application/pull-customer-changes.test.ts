import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { inMemoryCustomer, seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { pullCustomerChanges, SYNC_PAGE_SIZE } from "./pull-customer-changes";

const ARCHIVED_AT = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
let seeded: ReturnType<typeof seedCustomerOf>;
const run = () => pullCustomerChanges(createInMemoryCustomerDependencies(state));
const technician = organizationActorWith("technician");

beforeEach(() => {
  state = createInMemoryCustomerState();
  seeded = seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("pullCustomerChanges", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s pull the changes", async (role) => {
    const pulled = await run()(organizationActorWith(role), {});
    expect(pulled.changes.customers.map(({ id }) => id)).toEqual(["customer-a"]);
  });

  it("lets an impersonation read the changes", async () => {
    const pulled = await run()(organizationActorWith("owner", { isImpersonating: true }), {});
    expect(pulled.changes.customers).toHaveLength(1);
  });

  it("sends only the rows of the actor's organization, every photo without its storage key", async () => {
    const pulled = await run()(technician, {});
    const { storageKey: _storageKey, ...visiblePhoto } = seeded.photo;
    expect(pulled).toEqual({
      changes: {
        customers: [{ ...seeded.customer, deletedAt: null }],
        sites: [{ ...seeded.site, deletedAt: null }],
        equipments: [{ ...seeded.equipment, deletedAt: null }],
        photos: [{ ...visiblePhoto, deletedAt: null }],
      },
      cursors: {
        customers: { updatedAt: seeded.customer.updatedAt, id: "customer-a" },
        sites: { updatedAt: seeded.site.updatedAt, id: "site-a" },
        equipments: { updatedAt: seeded.equipment.updatedAt, id: "equipment-a" },
        photos: { updatedAt: seeded.photo.updatedAt, id: "photo-a" },
      },
      hasMore: false,
    });
  });

  it("sends nothing new and keeps the cursors once up to date", async () => {
    const first = await run()(technician, {});
    const second = await run()(technician, first.cursors);
    expect(second).toEqual({
      changes: { customers: [], sites: [], equipments: [], photos: [] },
      cursors: first.cursors,
      hasMore: false,
    });
  });

  it("sends archived rows as deletions after the cursor", async () => {
    const first = await run()(technician, {});
    [seeded.customer.id, seeded.site.id, seeded.equipment.id, seeded.photo.id].forEach((id) =>
      state.archivedAt.set(id, ARCHIVED_AT),
    );
    const second = await run()(technician, first.cursors);
    expect(second.changes.customers).toEqual([
      { ...seeded.customer, updatedAt: ARCHIVED_AT, deletedAt: ARCHIVED_AT },
    ]);
    expect(second.changes.photos.map(({ deletedAt }) => deletedAt)).toEqual([ARCHIVED_AT]);
  });

  it("pages each table separately, 200 rows at a time", async () => {
    expect(SYNC_PAGE_SIZE).toBe(200);
    Array.from({ length: SYNC_PAGE_SIZE }, (_, index) =>
      state.customers.push(
        inMemoryCustomer({
          id: `customer-${String(index).padStart(3, "0")}`,
          organizationId: "organization-a",
          lastName: "Martin",
          updatedAt: new Date(Date.parse("2026-02-01T00:00:00Z") + index * 1000),
        }),
      ),
    );
    const first = await run()(technician, {});
    expect(first.changes.customers).toHaveLength(200);
    expect(first.changes.sites).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    const second = await run()(technician, first.cursors);
    expect(second.changes.customers.map(({ id }) => id)).toEqual(["customer-199"]);
    expect(second.changes.sites).toEqual([]);
    expect(second.hasMore).toBe(false);
  });
});
