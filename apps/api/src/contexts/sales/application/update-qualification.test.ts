import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { updateQualification } from "./update-qualification";

const NOW = new Date("2026-10-24T08:00:00Z");
const EARLIER = new Date("2026-10-20T08:00:00Z");

let state: InMemorySalesState;
const run = () =>
  updateQualification(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(inMemoryCompany({ id: "company-1", name: "Gaz Hop" }));
});

describe("updateQualification", () => {
  it.each(PLATFORM_ROLES)("lets a %s qualify a company", async (role) => {
    expect(await run()(platformActorWith(role), "company-1", { interest: "warm" })).toEqual({
      isOk: true,
      value: null,
    });
  });

  it("creates the follow-up of a company never called", async () => {
    await run()(sales, "company-1", { interest: "hot", teamSize: "two_to_three" });
    expect(state.followUps).toEqual([
      {
        companyId: "company-1",
        lastCallAt: null,
        lastCallOutcome: null,
        lastCallByUserId: null,
        interest: "hot",
        teamSize: "two_to_three",
        toolKind: null,
        certificateVolume: null,
        decisionMaker: null,
        updatedAt: NOW,
      },
    ]);
  });

  it("changes only the given answers, clears an answer set to null, and keeps the last call", async () => {
    state.followUps.push({
      companyId: "company-1",
      lastCallAt: EARLIER,
      lastCallOutcome: "answered",
      lastCallByUserId: "user-antho",
      interest: "cold",
      teamSize: "solo",
      toolKind: "paper",
      certificateVolume: null,
      decisionMaker: "manager",
      updatedAt: EARLIER,
    });
    await run()(sales, "company-1", { interest: "hot", toolKind: null });
    expect(state.followUps).toEqual([
      {
        companyId: "company-1",
        lastCallAt: EARLIER,
        lastCallOutcome: "answered",
        lastCallByUserId: "user-antho",
        interest: "hot",
        teamSize: "solo",
        toolKind: null,
        certificateVolume: null,
        decisionMaker: "manager",
        updatedAt: NOW,
      },
    ]);
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown", { interest: "hot" })).toEqual({
      isOk: false,
      error: "company_not_found",
    });
    expect(state.followUps).toEqual([]);
  });
});
