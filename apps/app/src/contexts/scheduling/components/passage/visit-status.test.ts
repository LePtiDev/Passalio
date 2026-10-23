import { describe, expect, it } from "vitest";
import type { InterventionRecord } from "@/lib/db/local-records";
import { visitStatusOf } from "./visit-status";

const TODAY = "2026-10-23";

type ShownVisit = Pick<
  InterventionRecord,
  "status" | "scheduledDate" | "startTime" | "durationMinutes"
>;

const planned = (overrides: Partial<ShownVisit> = {}): ShownVisit => ({
  status: "planned",
  scheduledDate: TODAY,
  startTime: "09:00",
  durationMinutes: 60,
  ...overrides,
});

describe("visitStatusOf", () => {
  it("shows a completed visit as completed, whatever the time", () => {
    expect(visitStatusOf(planned({ status: "completed" }), TODAY, 9 * 60 + 30)).toBe("completed");
  });

  it("shows a cancelled visit as cancelled, whatever the time", () => {
    expect(visitStatusOf(planned({ status: "cancelled" }), TODAY, 9 * 60 + 30)).toBe("cancelled");
  });

  it("shows a visit as in progress between its start and its end today", () => {
    expect(visitStatusOf(planned(), TODAY, 9 * 60)).toBe("now");
    expect(visitStatusOf(planned(), TODAY, 9 * 60 + 59)).toBe("now");
  });

  it("shows a visit as planned before it starts and once it has ended", () => {
    expect(visitStatusOf(planned(), TODAY, 8 * 60 + 59)).toBe("planned");
    expect(visitStatusOf(planned(), TODAY, 10 * 60)).toBe("planned");
  });

  it("shows a visit on another day as planned", () => {
    expect(visitStatusOf(planned({ scheduledDate: "2026-10-24" }), TODAY, 9 * 60 + 30)).toBe(
      "planned",
    );
  });

  it("shows a visit without a time as planned", () => {
    expect(visitStatusOf(planned({ startTime: null }), TODAY, 9 * 60 + 30)).toBe("planned");
  });
});
