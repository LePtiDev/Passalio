import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { inMemoryTask } from "./call-test-fixtures";
import { updateTask } from "./update-task";

const NOW = new Date("2026-10-24T08:00:00Z");
const DUE_AT = new Date("2026-10-25T09:00:00Z");

let state: InMemorySalesState;
const run = () =>
  updateTask(
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
  state.tasks.push(
    inMemoryTask({
      id: "task-1",
      companyId: "company-1",
      dueAt: DUE_AT,
      notify: "minutes_15",
      notifyAt: new Date("2026-10-25T08:45:00Z"),
      notifiedAt: new Date("2026-10-25T08:45:00Z"),
    }),
    inMemoryTask({ id: "task-done", companyId: "company-1", dueAt: DUE_AT, status: "done" }),
  );
});

describe("updateTask", () => {
  it.each(PLATFORM_ROLES)("lets a %s mark a task done", async (role) => {
    expect(await run()(platformActorWith(role), "task-1", { status: "done" })).toEqual({
      isOk: true,
      value: null,
    });
    expect(state.tasks[0]).toMatchObject({ status: "done", updatedAt: NOW });
  });

  it("cancels a task", async () => {
    await run()(sales, "task-1", { status: "cancelled" });
    expect(state.tasks[0]?.status).toBe("cancelled");
  });

  it("moves a task and plans its notification again", async () => {
    await run()(sales, "task-1", {
      schedule: { dueAt: "2026-10-28T13:00:00.000Z", notify: "day_before" },
    });
    expect(state.tasks[0]).toMatchObject({
      status: "open",
      dueAt: new Date("2026-10-28T13:00:00Z"),
      notify: "day_before",
      notifyAt: new Date("2026-10-27T17:00:00Z"),
      notifiedAt: null,
      updatedAt: NOW,
    });
  });

  it("refuses to change a closed task", async () => {
    expect(await run()(sales, "task-done", { status: "cancelled" })).toEqual({
      isOk: false,
      error: "task_closed",
    });
    expect(state.tasks[1]?.status).toBe("done");
  });

  it("answers not found for an unknown task", async () => {
    expect(await run()(sales, "task-unknown", { status: "done" })).toEqual({
      isOk: false,
      error: "task_not_found",
    });
  });
});
