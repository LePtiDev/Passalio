import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { changeCompanyStage } from "./change-company-stage";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  changeCompanyStage(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "event-1",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(inMemoryCompany({ id: "company-1", name: "Gaz Hop", stage: "qualified" }));
});

describe("changeCompanyStage", () => {
  it.each(PLATFORM_ROLES)("lets a %s move a company to another stage", async (role) => {
    expect(await run()(platformActorWith(role), "company-1", "interested")).toEqual({
      isOk: true,
      value: null,
    });
    expect(state.companies[0]?.stage).toBe("interested");
  });

  it("writes the change in the company history with its author", async () => {
    await run()(sales, "company-1", "demo_planned");
    expect(state.events).toEqual([
      {
        id: "event-1",
        companyId: "company-1",
        contactId: null,
        authorUserId: sales.userId,
        kind: "stage_changed",
        body: null,
        fromStage: "qualified",
        toStage: "demo_planned",
        createdAt: NOW,
      },
    ]);
  });

  it("writes nothing in the history when the stage does not change", async () => {
    expect(await run()(sales, "company-1", "qualified")).toEqual({ isOk: true, value: null });
    expect(state.events).toEqual([]);
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown", "customer")).toEqual({
      isOk: false,
      error: "company_not_found",
    });
    expect(state.events).toEqual([]);
  });
});
