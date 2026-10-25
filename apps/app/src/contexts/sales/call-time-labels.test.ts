import { describe, expect, it } from "vitest";
import { clockLabel, dayTitle, dueAtOf, tomorrowOf, whenLabel } from "./call-time-labels";

const NOW = new Date("2026-10-24T08:00:00Z");

describe("call time labels", () => {
  it("writes a Paris clock time the French way", () => {
    expect(clockLabel(new Date("2026-10-24T12:00:00Z"))).toBe("14 h");
    expect(clockLabel(new Date("2026-10-24T08:30:00Z"))).toBe("10 h 30");
    expect(clockLabel(new Date("2026-10-26T08:05:00Z"))).toBe("9 h 05");
  });

  it("titles the day with its weekday", () => {
    expect(dayTitle(NOW)).toBe("Samedi 24 octobre");
  });

  it("says when a task is due, relative to today", () => {
    expect(whenLabel(new Date("2026-10-24T12:00:00Z"), NOW)).toBe("14 h");
    expect(whenLabel(new Date("2026-10-23T12:00:00Z"), NOW)).toBe("Hier, 14 h");
    expect(whenLabel(new Date("2026-10-25T13:00:00Z"), NOW)).toBe("Demain, 14 h");
    expect(whenLabel(new Date("2026-10-20T12:00:00Z"), NOW)).toBe("20 oct., 14 h");
  });

  it("turns the date and time fields into a Paris instant", () => {
    expect(dueAtOf("2026-10-27", "09:30")).toBe("2026-10-27T08:30:00.000Z");
    expect(dueAtOf("2026-07-01", "09:30")).toBe("2026-07-01T07:30:00.000Z");
  });

  it("proposes tomorrow by default", () => {
    expect(tomorrowOf(new Date("2026-10-24T22:30:00Z"))).toBe("2026-10-26");
    expect(tomorrowOf(NOW)).toBe("2026-10-25");
  });
});
