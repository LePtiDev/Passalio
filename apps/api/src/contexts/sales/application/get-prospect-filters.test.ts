import { PLATFORM_ROLES, prospectFiltersResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { getProspectFilters } from "./get-prospect-filters";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  getProspectFilters(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );

beforeEach(() => {
  state = createInMemorySalesState();
});

describe("getProspectFilters", () => {
  it.each(PLATFORM_ROLES)("gives the filters to a %s", async (role) => {
    const filters = await run()(platformActorWith(role));
    expect(prospectFiltersResponse.parse(filters)).toEqual(filters);
  });

  it("answers empty filters and zero totals when nothing is imported", async () => {
    expect(await run()(platformActorWith("sales"))).toEqual({
      departments: [],
      owners: [],
      totals: { companies: 0, contacts: 0 },
    });
  });

  it("lists departments with their count, the team members and the totals", async () => {
    state.people.push({ id: "user-quentin", name: "Quentin" }, { id: "user-antho", name: "Antho" });
    state.companies.push(
      inMemoryCompany({ id: "company-1", name: "Gaz Hop", department: "94" }),
      inMemoryCompany({ id: "company-2", name: "Ramonage Val", department: "94" }),
      inMemoryCompany({ id: "company-3", name: "Ramonage Paris", department: "75" }),
    );
    state.contacts.push(
      inMemoryContact({ id: "contact-1", companyId: "company-1", lastName: "Sauvageot" }),
      inMemoryContact({ id: "contact-2", companyId: "company-3", lastName: "Benet" }),
    );
    expect(await run()(platformActorWith("sales"))).toEqual({
      departments: [
        { code: "75", count: 1 },
        { code: "94", count: 2 },
      ],
      owners: [
        { id: "user-antho", name: "Antho" },
        { id: "user-quentin", name: "Quentin" },
      ],
      totals: { companies: 3, contacts: 2 },
    });
  });
});
