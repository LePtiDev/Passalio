import { describe, expect, it } from "vitest";
import { groupedSiren, groupedThousands, initialsOf, longDate, parisDateAndTime } from "./format";

describe("longDate", () => {
  it("writes a calendar date in French words", () => {
    expect(longDate("2026-10-23")).toBe("23 octobre 2026");
  });

  it("writes the first day of a month as 1er", () => {
    expect(longDate("2027-08-01")).toBe("1er août 2027");
  });
});

describe("parisDateAndTime", () => {
  it("shows the signing time in Paris summer time", () => {
    expect(parisDateAndTime("2026-10-23T09:44:00.000Z")).toEqual({
      date: "23/10/2026",
      time: "11:44",
      calendarDate: "2026-10-23",
    });
  });

  it("shows the signing time in Paris winter time", () => {
    expect(parisDateAndTime("2026-11-02T09:44:00.000Z").time).toBe("10:44");
  });

  it("keeps the Paris calendar day when UTC is still the day before", () => {
    expect(parisDateAndTime("2026-12-31T23:30:00.000Z").calendarDate).toBe("2027-01-01");
  });
});

describe("number grouping", () => {
  it("groups a SIREN by three digits with non-breaking spaces", () => {
    expect(groupedSiren("912345678")).toBe("912 345 678");
  });

  it("groups thousands with non-breaking spaces", () => {
    expect(groupedThousands(1_250_000)).toBe("1 250 000");
    expect(groupedThousands(500)).toBe("500");
  });
});

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("Ramonage Dupont")).toBe("RD");
    expect(initialsOf("élan ramonage & fils")).toBe("ÉR");
  });
});
