import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { updateCompany } from "./update-company";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  updateCompany(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.people.push({ id: "user-antho", name: "Antho" });
  state.companies.push(
    inMemoryCompany({
      id: "company-1",
      name: "Gaz Hop",
      city: "Alfortville",
      postalCode: "94140",
      department: "94",
      phone: "0102030405",
      ownerUserId: "user-antho",
    }),
  );
});

describe("updateCompany", () => {
  it.each(PLATFORM_ROLES)("lets a %s update a prospect company", async (role) => {
    expect(await run()(platformActorWith(role), "company-1", { phone: "0607080910" })).toEqual({
      isOk: true,
      value: null,
    });
    expect(state.companies[0]?.phone).toBe("0607080910");
  });

  it("keeps the fields left out and dates the change", async () => {
    await run()(sales, "company-1", { currentTool: "Excel" });
    expect(state.companies[0]).toMatchObject({
      name: "Gaz Hop",
      city: "Alfortville",
      phone: "0102030405",
      currentTool: "Excel",
      ownerUserId: "user-antho",
      updatedAt: NOW,
    });
  });

  it("keeps the search name and text in line with the new name and city", async () => {
    await run()(sales, "company-1", { name: "Gaz Hôp & Fils", city: "Créteil" });
    expect(state.companies[0]).toMatchObject({
      searchName: "gaz hop fils",
      searchText: "gaz hop fils creteil 94140",
    });
  });

  it("drops a cleared city from the search text", async () => {
    await run()(sales, "company-1", { city: null });
    expect(state.companies[0]?.searchText).toBe("gaz hop 94140");
  });

  it("gives the company to another member of the Passalio team", async () => {
    state.people.push({ id: "user-lea", name: "Léa" });
    expect(await run()(sales, "company-1", { ownerUserId: "user-lea" })).toEqual({
      isOk: true,
      value: null,
    });
    expect(state.companies[0]?.ownerUserId).toBe("user-lea");
  });

  it("lets nobody follow the company", async () => {
    await run()(sales, "company-1", { ownerUserId: null });
    expect(state.companies[0]?.ownerUserId).toBeNull();
  });

  it("refuses an owner who is not in the Passalio team", async () => {
    expect(await run()(sales, "company-1", { ownerUserId: "user-client" })).toEqual({
      isOk: false,
      error: "owner_not_found",
    });
    expect(state.companies[0]).toMatchObject({
      ownerUserId: "user-antho",
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown", { phone: "0607080910" })).toEqual({
      isOk: false,
      error: "company_not_found",
    });
  });
});
