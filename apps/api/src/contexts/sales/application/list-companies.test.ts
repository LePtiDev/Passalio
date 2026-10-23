import { PLATFORM_ROLES, prospectCompaniesPageResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { COMPANIES_PAGE_SIZE, listCompanies } from "./list-companies";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  listCompanies(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

const addCompanies = (count: number) => {
  Array.from({ length: count }, (_, index) =>
    state.companies.push(
      inMemoryCompany({
        id: `company-${String(index).padStart(3, "0")}`,
        name: `Ramonage ${String(index).padStart(3, "0")}`,
      }),
    ),
  );
};

beforeEach(() => {
  state = createInMemorySalesState();
});

describe("listCompanies", () => {
  it.each(PLATFORM_ROLES)("lets a %s list prospect companies", async (role) => {
    addCompanies(1);
    const page = await run()(platformActorWith(role), {});
    expect(page.companies.map(({ id }) => id)).toEqual(["company-000"]);
  });

  it("answers an empty page with every stage at zero", async () => {
    expect(await run()(sales, {})).toEqual({
      companies: [],
      counts: {
        all: 0,
        to_qualify: 0,
        qualified: 0,
        interested: 0,
        demo_planned: 0,
        customer: 0,
        not_interested: 0,
      },
      nextCursor: null,
    });
  });

  it("shows each company with its owner and main contact, without its search name", async () => {
    state.people.push({ id: "user-antho", name: "Antho" });
    state.companies.push(
      inMemoryCompany({
        id: "company-1",
        name: "Gaz Hop",
        city: "Alfortville",
        department: "94",
        phone: "0102030405",
        stage: "interested",
        ownerUserId: "user-antho",
      }),
    );
    state.contacts.push(
      inMemoryContact({ id: "contact-1", companyId: "company-1", lastName: "Benet" }),
      inMemoryContact({
        id: "contact-2",
        companyId: "company-1",
        firstName: "Gilles",
        lastName: "Sauvageot",
        isMain: true,
      }),
    );
    const page = await run()(sales, {});
    expect(prospectCompaniesPageResponse.parse(page)).toEqual(page);
    expect(page.companies).toEqual([
      {
        id: "company-1",
        name: "Gaz Hop",
        city: "Alfortville",
        department: "94",
        phone: "0102030405",
        stage: "interested",
        owner: { id: "user-antho", name: "Antho" },
        mainContact: { id: "contact-2", name: "Gilles Sauvageot" },
      },
    ]);
  });

  it("cuts the list to 50 companies by default and gives a cursor to the next page", async () => {
    addCompanies(COMPANIES_PAGE_SIZE + 1);
    const page = await run()(sales, {});
    expect(COMPANIES_PAGE_SIZE).toBe(50);
    expect(page.companies).toHaveLength(50);
    expect(page.nextCursor).not.toBeNull();
  });

  it("walks through every company page by page without gap or duplicate", async () => {
    addCompanies(5);
    const first = await run()(sales, { limit: 2 });
    const second = await run()(sales, { limit: 2, cursor: first.nextCursor ?? undefined });
    const third = await run()(sales, { limit: 2, cursor: second.nextCursor ?? undefined });
    expect(
      [...first.companies, ...second.companies, ...third.companies].map(({ id }) => id),
    ).toEqual(["company-000", "company-001", "company-002", "company-003", "company-004"]);
    expect(third.nextCursor).toBeNull();
  });

  it("starts from the first page when the cursor is not readable", async () => {
    addCompanies(2);
    const page = await run()(sales, { cursor: "garbage" });
    expect(page.companies.map(({ id }) => id)).toEqual(["company-000", "company-001"]);
  });

  it("filters by stage while counting every stage of the same department and owner", async () => {
    state.companies.push(
      inMemoryCompany({ id: "company-1", name: "A", department: "94", stage: "qualified" }),
      inMemoryCompany({ id: "company-2", name: "B", department: "94", stage: "to_qualify" }),
      inMemoryCompany({ id: "company-3", name: "C", department: "94", stage: "to_qualify" }),
      inMemoryCompany({ id: "company-4", name: "D", department: "75", stage: "qualified" }),
    );
    const page = await run()(sales, { stage: "qualified", department: "94" });
    expect(page.companies.map(({ id }) => id)).toEqual(["company-1"]);
    expect(page.counts).toEqual({
      all: 3,
      to_qualify: 2,
      qualified: 1,
      interested: 0,
      demo_planned: 0,
      customer: 0,
      not_interested: 0,
    });
  });

  it("filters by owner", async () => {
    state.companies.push(
      inMemoryCompany({ id: "company-1", name: "A", ownerUserId: "user-antho" }),
      inMemoryCompany({ id: "company-2", name: "B", ownerUserId: "user-lea" }),
    );
    const page = await run()(sales, { ownerUserId: "user-antho" });
    expect(page.companies.map(({ id }) => id)).toEqual(["company-1"]);
    expect(page.counts.all).toBe(1);
  });

  it("searches once the query is trimmed and ignores a blank query", async () => {
    state.companies.push(
      inMemoryCompany({ id: "company-1", name: "Gaz Hop", city: "Créteil" }),
      inMemoryCompany({ id: "company-2", name: "Ramonage Val", city: "Paris" }),
    );
    expect((await run()(sales, { query: "  creteil " })).companies.map(({ id }) => id)).toEqual([
      "company-1",
    ]);
    expect((await run()(sales, { query: "   " })).companies.map(({ id }) => id)).toEqual([
      "company-1",
      "company-2",
    ]);
  });
});
