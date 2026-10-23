import { PLATFORM_ROLES, prospectContactsPageResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { CONTACTS_PAGE_SIZE, listContacts } from "./list-contacts";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  listContacts(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

const addContacts = (count: number) => {
  Array.from({ length: count }, (_, index) =>
    state.contacts.push(
      inMemoryContact({
        id: `contact-${String(index).padStart(3, "0")}`,
        companyId: "company-1",
        lastName: `Name ${String(index).padStart(3, "0")}`,
      }),
    ),
  );
};

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({
      id: "company-1",
      name: "Gaz Hop",
      city: "Alfortville",
      department: "94",
      phone: "0199999999",
    }),
    inMemoryCompany({ id: "company-2", name: "Ramonage Paris", city: "Paris", department: "75" }),
  );
});

describe("listContacts", () => {
  it.each(PLATFORM_ROLES)("lets a %s list contacts", async (role) => {
    addContacts(1);
    const page = await run()(platformActorWith(role), { filter: "all" });
    expect(page.contacts.map(({ id }) => id)).toEqual(["contact-000"]);
  });

  it("answers an empty page with zero counts", async () => {
    expect(await run()(sales, { filter: "all" })).toEqual({
      contacts: [],
      counts: { all: 0, leaders: 0, no_phone: 0 },
      nextCursor: null,
    });
  });

  it("shows each contact by full name with its company and the best phone to call", async () => {
    state.contacts.push(
      inMemoryContact({
        id: "contact-1",
        companyId: "company-1",
        firstName: "Gilles",
        lastName: "Sauvageot",
        jobTitle: "Gérant",
        isLeader: true,
        mobile: "0607080910",
        email: "gilles@gazhop.fr",
      }),
    );
    const page = await run()(sales, { filter: "all" });
    expect(prospectContactsPageResponse.parse(page)).toEqual(page);
    expect(page.contacts).toEqual([
      {
        id: "contact-1",
        name: "Gilles Sauvageot",
        jobTitle: "Gérant",
        isLeader: true,
        phone: "0607080910",
        email: "gilles@gazhop.fr",
        company: { id: "company-1", name: "Gaz Hop", city: "Alfortville", department: "94" },
      },
    ]);
  });

  it("cuts the list to 50 contacts by default and gives a cursor to the next page", async () => {
    addContacts(CONTACTS_PAGE_SIZE + 1);
    const page = await run()(sales, { filter: "all" });
    expect(CONTACTS_PAGE_SIZE).toBe(50);
    expect(page.contacts).toHaveLength(50);
    expect(page.nextCursor).not.toBeNull();
  });

  it("walks through every contact page by page without gap or duplicate", async () => {
    addContacts(5);
    const first = await run()(sales, { filter: "all", limit: 2 });
    const second = await run()(sales, {
      filter: "all",
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    const third = await run()(sales, {
      filter: "all",
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect([...first.contacts, ...second.contacts, ...third.contacts].map(({ id }) => id)).toEqual([
      "contact-000",
      "contact-001",
      "contact-002",
      "contact-003",
      "contact-004",
    ]);
    expect(third.nextCursor).toBeNull();
  });

  it("filters leaders and counts each tab in the department", async () => {
    state.contacts.push(
      inMemoryContact({ id: "contact-1", companyId: "company-2", lastName: "A", isLeader: true }),
      inMemoryContact({ id: "contact-2", companyId: "company-2", lastName: "B", phone: "01" }),
      inMemoryContact({ id: "contact-3", companyId: "company-1", lastName: "C", isLeader: true }),
    );
    const page = await run()(sales, { filter: "leaders", department: "75" });
    expect(page.contacts.map(({ id }) => id)).toEqual(["contact-1"]);
    expect(page.counts).toEqual({ all: 2, leaders: 1, no_phone: 1 });
  });

  it("searches once the query is trimmed and ignores a blank query", async () => {
    state.contacts.push(
      inMemoryContact({ id: "contact-1", companyId: "company-1", lastName: "Sauvageot" }),
      inMemoryContact({ id: "contact-2", companyId: "company-2", lastName: "Benet" }),
    );
    expect(
      (await run()(sales, { filter: "all", query: "  sauvageot " })).contacts.map(({ id }) => id),
    ).toEqual(["contact-1"]);
    expect(
      (await run()(sales, { filter: "all", query: "  " })).contacts.map(({ id }) => id),
    ).toEqual(["contact-2", "contact-1"]);
  });
});
