import type { Actor, CustomerMutation } from "@passalio/shared";
import * as fc from "fast-check";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { applyCustomerMutation } from "./apply-customer-mutation";
import {
  pullCustomerChanges,
  SYNC_PAGE_SIZE,
  type CustomerSyncCursors,
} from "./pull-customer-changes";

const ORGANIZATION_ID = "organization-a";
const START = Date.parse("2026-10-22T10:00:00Z");

const uuidOf = (prefix: number, index: number) =>
  `0190f3a0-0000-7000-8${String(prefix).padStart(3, "0")}-${String(index).padStart(12, "0")}`;

const customerIdOf = (index: number) => uuidOf(1, index);
const siteIdOf = (index: number) => uuidOf(2, index);
const equipmentIdOf = (index: number) => uuidOf(3, index);

const actor = (userId = "user-technician"): Actor => ({
  userId,
  organizationId: ORGANIZATION_ID,
  role: "technician",
  isImpersonating: false,
});

const owner: Actor = { ...actor("user-owner"), role: "owner" };

const freshState = () => {
  const state = createInMemoryCustomerState();
  state.trades.set(ORGANIZATION_ID, ["chimney_sweeping"]);
  return state;
};

const sequentialClock = (startAt = START) => {
  let current = startAt;
  return () => new Date((current += 1000));
};

const applyAll = async (
  state: InMemoryCustomerState,
  mutations: readonly CustomerMutation[],
  now: () => Date,
  by: Actor = owner,
) => {
  const apply = applyCustomerMutation(createInMemoryCustomerDependencies(state, now));
  return mutations.reduce<Promise<boolean[]>>(
    async (previous, mutation) => [...(await previous), (await apply(by, mutation)).isOk],
    Promise.resolve([]),
  );
};

const creationOf = (index: number, lastName = `Client ${index}`): CustomerMutation => ({
  type: "create_customer",
  customerId: customerIdOf(index),
  customer: { kind: "individual", lastName },
});

type PulledCustomer = { readonly id: string; readonly lastName: string | null };

const pullEverything = async (
  state: InMemoryCustomerState,
  from: CustomerSyncCursors = {},
  between: (pageNumber: number) => Promise<void> = async () => undefined,
) => {
  const pull = pullCustomerChanges(createInMemoryCustomerDependencies(state));
  const pullFrom = async (
    cursors: CustomerSyncCursors,
    pages: readonly (readonly PulledCustomer[])[],
  ): Promise<{
    readonly pages: readonly (readonly PulledCustomer[])[];
    readonly cursors: CustomerSyncCursors;
  }> => {
    const page = await pull(actor(), cursors);
    const pulled = [...pages, page.changes.customers.map(({ id, lastName }) => ({ id, lastName }))];
    await between(pulled.length);
    return page.hasMore ? pullFrom(page.cursors, pulled) : { pages: pulled, cursors: page.cursors };
  };
  return pullFrom(from, []);
};

const stateSnapshot = (state: InMemoryCustomerState) => ({
  customers: state.customers.map(({ updatedAt: _updatedAt, ...customer }) => customer),
  sites: state.sites.map(({ updatedAt: _updatedAt, ...site }) => site),
  equipments: state.equipments.map(({ updatedAt: _updatedAt, ...equipment }) => equipment),
  archived: [...state.archivedAt.keys()],
});

const CUSTOMER_COUNT = 3;

const customerIndex = fc.integer({ min: 0, max: CUSTOMER_COUNT - 1 });

const lastNameArbitrary = fc.constantFrom("Martin", "Bernard", "Dubois", "Moreau");

const replayableMutation: fc.Arbitrary<CustomerMutation> = fc.oneof(
  customerIndex.map((index) => creationOf(index)),
  fc
    .record({ index: customerIndex, lastName: lastNameArbitrary })
    .map(({ index, lastName }): CustomerMutation => ({
      type: "update_customer",
      customerId: customerIdOf(index),
      changes: { lastName },
    })),
  customerIndex.map((index): CustomerMutation => ({
    type: "add_site",
    siteId: siteIdOf(index),
    customerId: customerIdOf(index),
    site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
  })),
  fc
    .record({ index: customerIndex, city: fc.constantFrom("Ivry", "Vitry", "Créteil") })
    .map(({ index, city }): CustomerMutation => ({
      type: "update_site",
      siteId: siteIdOf(index),
      changes: { city },
    })),
  customerIndex.map((index): CustomerMutation => ({
    type: "add_equipment",
    equipmentId: equipmentIdOf(index),
    siteId: siteIdOf(index),
    equipment: { kind: "insert" },
  })),
  fc
    .record({ index: customerIndex, brand: fc.constantFrom("Supra", "Invicta") })
    .map(({ index, brand }): CustomerMutation => ({
      type: "update_equipment",
      equipmentId: equipmentIdOf(index),
      changes: { brand },
    })),
);

const prerequisiteOf = (mutation: CustomerMutation): string | undefined => {
  switch (mutation.type) {
    case "create_customer":
      return undefined;
    case "update_customer":
    case "archive_customer":
    case "add_site":
      return mutation.customerId;
    case "update_site":
    case "add_equipment":
      return mutation.siteId;
    default:
      return mutation.equipmentId;
  }
};

const createdIdOf = (mutation: CustomerMutation): string | undefined => {
  switch (mutation.type) {
    case "create_customer":
      return mutation.customerId;
    case "add_site":
      return mutation.siteId;
    case "add_equipment":
      return mutation.equipmentId;
    default:
      return undefined;
  }
};

const inCausalOrder = (mutations: readonly CustomerMutation[]) => {
  const created = new Set<string>();
  return mutations.filter((mutation) => {
    const prerequisite = prerequisiteOf(mutation);
    const createdId = createdIdOf(mutation);
    if (prerequisite !== undefined && !created.has(prerequisite)) {
      return false;
    }
    if (createdId === undefined) {
      return true;
    }
    if (created.has(createdId)) {
      return false;
    }
    created.add(createdId);
    return true;
  });
};

const causalBatch = fc
  .array(replayableMutation, { minLength: 1, maxLength: 80 })
  .map((mutations) => inCausalOrder(mutations).slice(0, 50));

let state: InMemoryCustomerState;

beforeEach(() => {
  state = freshState();
});

describe("pull cursor pagination properties", () => {
  it("returns every row exactly once in pages of at most 200, even when updated_at ties", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 3 }), { maxLength: SYNC_PAGE_SIZE * 3 + 7 }),
        async (offsets) => {
          const current = freshState();
          let call = 0;
          await applyAll(
            current,
            offsets.map((_, index) => creationOf(index)),
            () => new Date(START + (offsets[call++] ?? 0) * 1000),
          );
          const { pages } = await pullEverything(current);
          const pulledIds = pages.flat().map(({ id }) => id);
          expect(pages.every((page) => page.length <= SYNC_PAGE_SIZE)).toBe(true);
          expect(new Set(pulledIds).size).toBe(pulledIds.length);
          expect(pulledIds.toSorted()).toEqual(offsets.map((_, index) => customerIdOf(index)));
        },
      ),
      { numRuns: 25 },
    );
  });

  it("never loses a change made between two pages", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: SYNC_PAGE_SIZE + 1, max: SYNC_PAGE_SIZE * 2 + 50 }),
        fc.uniqueArray(fc.nat(), { minLength: 1, maxLength: 20 }),
        async (count, picks) => {
          const current = freshState();
          const sameInstant = () => new Date(START);
          await applyAll(
            current,
            Array.from({ length: count }, (_, index) => creationOf(index)),
            sameInstant,
          );
          const updated = [...new Set(picks.map((pick) => pick % count))];
          const later = sequentialClock(START + 60_000);
          const { pages } = await pullEverything(current, {}, async (pageNumber) => {
            if (pageNumber === 1) {
              await applyAll(
                current,
                updated.map((index): CustomerMutation => ({
                  type: "update_customer",
                  customerId: customerIdOf(index),
                  changes: { lastName: `Modifié ${index}` },
                })),
                later,
              );
            }
          });
          const lastSeen = new Map(pages.flat().map(({ id, lastName }) => [id, lastName]));
          expect(lastSeen.size).toBe(count);
          expect(updated.map((index) => lastSeen.get(customerIdOf(index)))).toEqual(
            updated.map((index) => `Modifié ${index}`),
          );
        },
      ),
      { numRuns: 20 },
    );
  });

  it("starts again from the returned cursor without repeating any row", async () => {
    await applyAll(
      state,
      Array.from({ length: SYNC_PAGE_SIZE + 5 }, (_, index) => creationOf(index)),
      () => new Date(START),
    );
    const { cursors } = await pullEverything(state);
    const again = await pullCustomerChanges(createInMemoryCustomerDependencies(state))(
      actor(),
      cursors,
    );
    expect(again.changes.customers).toEqual([]);
    expect(again.hasMore).toBe(false);
    expect(again.cursors).toEqual(cursors);
  });
});

describe("deletions in the pull feed", () => {
  it("sends an archived customer, its sites, equipments and photos again with deletedAt", async () => {
    const clock = sequentialClock();
    await applyAll(
      state,
      [
        creationOf(1),
        {
          type: "add_site",
          siteId: siteIdOf(1),
          customerId: customerIdOf(1),
          site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
        },
        {
          type: "add_equipment",
          equipmentId: equipmentIdOf(1),
          siteId: siteIdOf(1),
          equipment: { kind: "insert" },
        },
      ],
      clock,
    );
    const pull = pullCustomerChanges(createInMemoryCustomerDependencies(state));
    const before = await pull(actor(), {});
    expect(before.changes.customers.map(({ deletedAt }) => deletedAt)).toEqual([null]);
    await applyAll(state, [{ type: "archive_customer", customerId: customerIdOf(1) }], clock);
    const after = await pull(actor(), before.cursors);
    expect(after.changes.customers.map(({ id }) => id)).toEqual([customerIdOf(1)]);
    expect(after.changes.customers[0]?.deletedAt).toBeInstanceOf(Date);
    expect(after.changes.sites.map(({ id }) => id)).toEqual([siteIdOf(1)]);
    expect(after.changes.sites[0]?.deletedAt).toBeInstanceOf(Date);
    expect(after.changes.equipments.map(({ id }) => id)).toEqual([equipmentIdOf(1)]);
    expect(after.changes.equipments[0]?.deletedAt).toBeInstanceOf(Date);
  });
});

describe("replayed push properties", () => {
  it("pushing the same batch twice leaves the same records as pushing it once", async () => {
    await fc.assert(
      fc.asyncProperty(causalBatch, async (batch) => {
        const once = freshState();
        await applyAll(once, batch, sequentialClock());
        const twice = freshState();
        const clock = sequentialClock();
        const first = await applyAll(twice, batch, clock);
        const second = await applyAll(twice, batch, clock);
        expect(stateSnapshot(twice)).toEqual(stateSnapshot(once));
        expect(twice.customers.length).toBe(new Set(twice.customers.map(({ id }) => id)).size);
        expect(first).toEqual(batch.map(() => true));
        expect(second).toEqual(batch.map(() => true));
      }),
      { numRuns: 100 },
    );
  });

  it("accepts every creation again when the same batch is replayed", async () => {
    await fc.assert(
      fc.asyncProperty(causalBatch, async (batch) => {
        const current = freshState();
        const clock = sequentialClock();
        const first = await applyAll(current, batch, clock);
        const replay = await applyAll(current, batch, clock);
        const acceptedCreations = batch.flatMap((mutation, index) =>
          createdIdOf(mutation) !== undefined && first[index] === true ? [index] : [],
        );
        expect(acceptedCreations.map((index) => replay[index])).toEqual(
          acceptedCreations.map(() => true),
        );
      }),
      { numRuns: 100 },
    );
  });

  it("applies the mutations of a batch in the order they were sent", async () => {
    const clock = sequentialClock();
    expect(
      await applyAll(
        state,
        [
          {
            type: "add_site",
            siteId: siteIdOf(1),
            customerId: customerIdOf(1),
            site: { address: "1 rue A", postalCode: "94200", city: "Ivry", buildingType: "house" },
          },
          creationOf(1),
        ],
        clock,
      ),
    ).toEqual([false, true]);
    expect(
      await applyAll(
        state,
        [
          {
            type: "update_customer",
            customerId: customerIdOf(1),
            changes: { lastName: "Premier" },
          },
          { type: "update_customer", customerId: customerIdOf(1), changes: { lastName: "Second" } },
        ],
        clock,
      ),
    ).toEqual([true, true]);
    expect(state.customers[0]?.lastName).toBe("Second");
  });
});

describe("concurrent edits", () => {
  it("keeps both changes when two people edit different fields of the same customer", async () => {
    const clock = sequentialClock();
    await applyAll(state, [creationOf(1, "Lefèvre")], clock);
    await applyAll(
      state,
      [{ type: "update_customer", customerId: customerIdOf(1), changes: { phone: "0600000000" } }],
      clock,
      actor("user-a"),
    );
    await applyAll(
      state,
      [{ type: "update_customer", customerId: customerIdOf(1), changes: { notes: "Chien" } }],
      clock,
      actor("user-b"),
    );
    expect(state.customers[0]).toMatchObject({
      lastName: "Lefèvre",
      phone: "0600000000",
      notes: "Chien",
    });
  });

  it("keeps the last received change when two people edit the same field", async () => {
    const clock = sequentialClock();
    await applyAll(state, [creationOf(1, "Lefèvre")], clock);
    await applyAll(
      state,
      [{ type: "update_customer", customerId: customerIdOf(1), changes: { phone: "0600000001" } }],
      clock,
      actor("user-b"),
    );
    await applyAll(
      state,
      [{ type: "update_customer", customerId: customerIdOf(1), changes: { phone: "0600000002" } }],
      clock,
      actor("user-a"),
    );
    expect(state.customers[0]?.phone).toBe("0600000002");
  });
});
