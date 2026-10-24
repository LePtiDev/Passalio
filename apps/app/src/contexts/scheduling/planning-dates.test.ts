import { describe, expect, it } from "vitest";
import {
  addDays,
  dayNumberOf,
  isWeekend,
  longDayLabel,
  numericDateLabel,
  parisMinutesOf,
  todayOf,
  weekDaysOf,
  weekdayIndexOf,
  weekStartOf,
} from "./planning-dates";

describe("todayOf", () => {
  it("returns the Paris day, not the UTC day, late in the evening", () => {
    expect(todayOf(new Date("2026-10-23T22:30:00Z"))).toBe("2026-10-24");
  });

  it("switches to the new year at Paris midnight in winter", () => {
    expect(todayOf(new Date("2026-12-31T22:59:00Z"))).toBe("2026-12-31");
    expect(todayOf(new Date("2026-12-31T23:00:00Z"))).toBe("2027-01-01");
  });

  it("follows the summer offset on the night of the spring change", () => {
    expect(todayOf(new Date("2026-03-28T22:59:00Z"))).toBe("2026-03-28");
    expect(todayOf(new Date("2026-03-28T23:00:00Z"))).toBe("2026-03-29");
  });
});

describe("parisMinutesOf", () => {
  it("returns the minutes since Paris midnight in summer", () => {
    expect(parisMinutesOf(new Date("2026-07-01T07:15:00Z"))).toBe(9 * 60 + 15);
  });

  it("returns the minutes since Paris midnight in winter", () => {
    expect(parisMinutesOf(new Date("2026-12-01T07:15:00Z"))).toBe(8 * 60 + 15);
  });

  it("returns zero at Paris midnight", () => {
    expect(parisMinutesOf(new Date("2026-07-01T22:00:00Z"))).toBe(0);
  });

  it("jumps from 2:00 to 3:00 when summer time starts", () => {
    expect(parisMinutesOf(new Date("2026-03-29T00:59:00Z"))).toBe(1 * 60 + 59);
    expect(parisMinutesOf(new Date("2026-03-29T01:00:00Z"))).toBe(3 * 60);
  });

  it("plays 2:30 twice when summer time ends", () => {
    expect(parisMinutesOf(new Date("2026-10-25T00:30:00Z"))).toBe(2 * 60 + 30);
    expect(parisMinutesOf(new Date("2026-10-25T01:30:00Z"))).toBe(2 * 60 + 30);
  });
});

describe("addDays", () => {
  it("moves forward and backward by whole days", () => {
    expect(addDays("2026-10-23", 1)).toBe("2026-10-24");
    expect(addDays("2026-10-23", -7)).toBe("2026-10-16");
    expect(addDays("2026-10-23", 0)).toBe("2026-10-23");
  });

  it("crosses months, years and leap days", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("is not shifted by daylight saving changes", () => {
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });
});

describe("weeks", () => {
  it("numbers the days from Monday (0) to Sunday (6)", () => {
    expect(weekdayIndexOf("2026-10-19")).toBe(0);
    expect(weekdayIndexOf("2026-10-23")).toBe(4);
    expect(weekdayIndexOf("2026-10-25")).toBe(6);
  });

  it("starts the week on Monday, including from a Sunday", () => {
    expect(weekStartOf("2026-10-19")).toBe("2026-10-19");
    expect(weekStartOf("2026-10-23")).toBe("2026-10-19");
    expect(weekStartOf("2026-10-25")).toBe("2026-10-19");
    expect(weekStartOf("2026-10-26")).toBe("2026-10-26");
  });

  it("lists the seven days from Monday to Sunday", () => {
    expect(weekDaysOf("2026-10-23")).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });

  it("lists a week that spans two years", () => {
    expect(weekDaysOf("2027-01-01")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("marks Saturday and Sunday as weekend", () => {
    expect(isWeekend("2026-10-23")).toBe(false);
    expect(isWeekend("2026-10-24")).toBe(true);
    expect(isWeekend("2026-10-25")).toBe(true);
    expect(isWeekend("2026-10-26")).toBe(false);
  });
});

describe("labels", () => {
  it("gives the day of the month", () => {
    expect(dayNumberOf("2026-10-05")).toBe(5);
  });

  it("writes the long day label in French with a capital letter", () => {
    expect(longDayLabel("2026-10-23")).toBe("Vendredi 23 octobre");
  });

  it("writes the numeric date in French order", () => {
    expect(numericDateLabel("2026-10-05")).toBe("05/10/2026");
  });
});
