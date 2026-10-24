import { describe, expect, it } from "vitest";
import { myDay, prospectTask } from "@/test-support/call-records";
import { myDaySummaryOf } from "./my-day-summary";

const NOW = new Date("2026-10-24T10:00:00Z");

describe("myDaySummaryOf", () => {
  it("counts the calls, the callbacks with the next one to come, the overdue tasks and the demos", () => {
    const day = myDay({
      tasks: [
        prospectTask("late", { dueAt: "2026-10-24T07:00:00.000Z" }),
        prospectTask("next", { dueAt: "2026-10-24T12:00:00.000Z" }),
        prospectTask("demo", { kind: "demo", dueAt: "2026-10-24T16:00:00.000Z" }),
        prospectTask("later", { dueAt: "2026-10-24T14:15:00.000Z" }),
      ],
      counts: { overdue: 1, today: 3, callsToday: 7 },
    });
    expect(myDaySummaryOf(day, NOW)).toEqual({
      callsToday: 7,
      callbacks: 3,
      nextCallbackAt: new Date("2026-10-24T12:00:00.000Z"),
      overdue: 1,
      demos: 1,
    });
  });

  it("has no next callback when every callback is late", () => {
    const day = myDay({ tasks: [prospectTask("late", { dueAt: "2026-10-24T07:00:00.000Z" })] });
    expect(myDaySummaryOf(day, NOW).nextCallbackAt).toBeNull();
  });
});
