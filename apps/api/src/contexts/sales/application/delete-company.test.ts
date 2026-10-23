import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { deleteCompany } from "./delete-company";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  deleteCompany(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({ id: "company-1", name: "Gaz Hop" }),
    inMemoryCompany({ id: "company-2", name: "Ramonage Val" }),
  );
});

describe("deleteCompany", () => {
  it.each(PLATFORM_ROLES)("lets a %s delete a company after an objection", async (role) => {
    expect(await run()(platformActorWith(role), "company-1")).toEqual({ isOk: true, value: null });
    expect(state.companies.map(({ id }) => id)).toEqual(["company-2"]);
  });

  it("records who deleted which company in the audit log", async () => {
    await run()(sales, "company-1");
    expect(state.deletedCompanies).toEqual([{ actorUserId: sales.userId, companyId: "company-1" }]);
  });

  it("answers not found for an unknown company and records nothing", async () => {
    expect(await run()(sales, "company-unknown")).toEqual({
      isOk: false,
      error: "company_not_found",
    });
    expect(state.deletedCompanies).toEqual([]);
    expect(state.companies).toHaveLength(2);
  });

  it("answers not found when the company is deleted twice", async () => {
    await run()(sales, "company-1");
    expect(await run()(sales, "company-1")).toEqual({ isOk: false, error: "company_not_found" });
    expect(state.deletedCompanies).toHaveLength(1);
  });
});
