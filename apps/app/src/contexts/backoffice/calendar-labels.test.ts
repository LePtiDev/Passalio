import { describe, expect, it } from "vitest";
import { dayKeyOf, journalDayLabel, lastSeenLabel } from "./calendar-labels";

const NOW = new Date("2026-10-23T08:00:00Z");

describe("lastSeenLabel", () => {
  it("counts days in Paris time", () => {
    expect(lastSeenLabel(null, NOW)).toBe("Jamais");
    expect(lastSeenLabel("2026-10-23", NOW)).toBe("aujourd'hui");
    expect(lastSeenLabel("2026-10-22", NOW)).toBe("hier");
    expect(lastSeenLabel("2026-10-13", NOW)).toBe("il y a 10 j");
    expect(lastSeenLabel("2026-08-01", NOW)).toBe("1 août");
  });

  it("uses the Paris day just after midnight", () => {
    expect(dayKeyOf(new Date("2026-10-22T22:30:00Z"))).toBe("2026-10-23");
  });
});

describe("journalDayLabel", () => {
  it("names today and yesterday", () => {
    expect(journalDayLabel("2026-10-23", NOW)).toBe("Aujourd'hui · vendredi 23 octobre");
    expect(journalDayLabel("2026-10-22", NOW)).toBe("Hier · jeudi 22 octobre");
    expect(journalDayLabel("2026-10-20", NOW)).toBe("mardi 20 octobre");
  });
});
