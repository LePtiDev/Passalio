import { PLATFORM_ROLES, prospectMyDayResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { inMemoryCall, inMemoryTask } from "./call-test-fixtures";
import { getMyDay, MY_DAY_TASKS_LIMIT } from "./get-my-day";

const NOW = new Date("2026-10-24T08:00:00Z");

let state: InMemorySalesState;
const run = () =>
  getMyDay(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");
const owner = sales.userId;

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(inMemoryCompany({ id: "company-1", name: "Gaz Hop" }));
});

describe("getMyDay", () => {
  it.each(PLATFORM_ROLES)("gives a %s their day", async (role) => {
    expect(prospectMyDayResponse.parse(await run()(platformActorWith(role)))).toEqual({
      tasks: [],
      counts: { overdue: 0, today: 0, callsToday: 0 },
    });
  });

  it("lists my open tasks until the end of the Paris day, overdue first", async () => {
    state.tasks.push(
      inMemoryTask({
        id: "task-yesterday",
        companyId: "company-1",
        ownerUserId: owner,
        dueAt: new Date("2026-10-23T14:00:00Z"),
      }),
      inMemoryTask({
        id: "task-this-evening",
        companyId: "company-1",
        ownerUserId: owner,
        dueAt: new Date("2026-10-24T21:30:00Z"),
      }),
      inMemoryTask({
        id: "task-tomorrow",
        companyId: "company-1",
        ownerUserId: owner,
        dueAt: new Date("2026-10-24T22:00:00Z"),
      }),
      inMemoryTask({
        id: "task-this-morning",
        companyId: "company-1",
        ownerUserId: owner,
        dueAt: new Date("2026-10-24T09:00:00Z"),
      }),
      inMemoryTask({
        id: "task-done",
        companyId: "company-1",
        ownerUserId: owner,
        dueAt: new Date("2026-10-24T09:00:00Z"),
        status: "done",
      }),
      inMemoryTask({
        id: "task-of-quentin",
        companyId: "company-1",
        ownerUserId: "user-quentin",
        dueAt: new Date("2026-10-24T09:00:00Z"),
      }),
    );
    const day = await run()(sales);
    expect(day.tasks.map(({ id }) => id)).toEqual([
      "task-yesterday",
      "task-this-morning",
      "task-this-evening",
    ]);
    expect(day.counts).toEqual({ overdue: 1, today: 2, callsToday: 0 });
  });

  it("counts my calls since midnight Paris time", async () => {
    state.calls.push(
      inMemoryCall({
        id: "call-before-midnight",
        companyId: "company-1",
        authorUserId: owner,
        calledAt: new Date("2026-10-23T21:59:00Z"),
      }),
      inMemoryCall({
        id: "call-after-midnight",
        companyId: "company-1",
        authorUserId: owner,
        calledAt: new Date("2026-10-23T22:00:00Z"),
      }),
      inMemoryCall({ id: "call-now", companyId: "company-1", authorUserId: owner, calledAt: NOW }),
      inMemoryCall({
        id: "call-of-quentin",
        companyId: "company-1",
        authorUserId: "user-quentin",
        calledAt: NOW,
      }),
    );
    expect((await run()(sales)).counts.callsToday).toBe(2);
  });

  it(`shows at most ${MY_DAY_TASKS_LIMIT} tasks`, async () => {
    state.tasks.push(
      ...Array.from({ length: MY_DAY_TASKS_LIMIT + 1 }, (_, index) =>
        inMemoryTask({
          id: `task-${String(index).padStart(3, "0")}`,
          companyId: "company-1",
          ownerUserId: owner,
          dueAt: new Date(NOW.getTime() - index * 1000),
        }),
      ),
    );
    expect((await run()(sales)).tasks).toHaveLength(MY_DAY_TASKS_LIMIT);
  });
});
