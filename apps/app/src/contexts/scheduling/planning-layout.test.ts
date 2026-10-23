import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIRST_HOUR,
  DEFAULT_LAST_HOUR,
  fitLanes,
  hourRangeOf,
  isWithin,
  minutesOf,
  offsetOf,
  placeSlots,
  timeLabelOf,
  type TimedSlot,
} from "./planning-layout";

const slot = (id: string, start: string, durationMinutes = 60): TimedSlot => ({
  id,
  startMinutes: minutesOf(start),
  durationMinutes,
});

const overlaps = (left: TimedSlot, right: TimedSlot) =>
  left.startMinutes < right.startMinutes + right.durationMinutes &&
  right.startMinutes < left.startMinutes + left.durationMinutes;

const placementsById = (slots: readonly TimedSlot[]) =>
  Object.fromEntries(
    placeSlots(slots).map(({ slot: { id }, lane, laneCount, cluster }) => [
      id,
      { lane, laneCount, cluster },
    ]),
  );

describe("minutesOf and timeLabelOf", () => {
  it("converts a time of day to minutes since midnight", () => {
    expect(minutesOf("00:00")).toBe(0);
    expect(minutesOf("08:30")).toBe(510);
    expect(minutesOf("23:59")).toBe(1439);
  });

  it("writes minutes as a two-digit time", () => {
    expect(timeLabelOf(0)).toBe("00:00");
    expect(timeLabelOf(545)).toBe("09:05");
    expect(timeLabelOf(1439)).toBe("23:59");
  });

  it("keeps the label within the day", () => {
    expect(timeLabelOf(-30)).toBe("00:00");
    expect(timeLabelOf(24 * 60 + 90)).toBe("24:00");
  });

  it("round-trips every quarter hour", () => {
    const quarters = Array.from({ length: 96 }, (_, index) => index * 15);
    expect(quarters.map((minutes) => minutesOf(timeLabelOf(minutes)))).toEqual(quarters);
  });
});

describe("hourRangeOf", () => {
  it("shows 8:00 to 19:00 by default", () => {
    expect(DEFAULT_FIRST_HOUR).toBe(8);
    expect(DEFAULT_LAST_HOUR).toBe(19);
    expect(hourRangeOf([])).toEqual({ firstHour: 8, lastHour: 19 });
  });

  it("keeps the default range when every visit fits", () => {
    expect(hourRangeOf([slot("a", "08:00"), slot("b", "18:00")])).toEqual({
      firstHour: 8,
      lastHour: 19,
    });
  });

  it("starts earlier when a visit starts before 8:00", () => {
    expect(hourRangeOf([slot("a", "06:45")]).firstHour).toBe(6);
  });

  it("ends later when a visit ends after 19:00", () => {
    expect(hourRangeOf([slot("a", "18:30")]).lastHour).toBe(20);
    expect(hourRangeOf([slot("a", "19:00", 120)]).lastHour).toBe(21);
  });

  it("never goes past midnight", () => {
    expect(hourRangeOf([slot("a", "23:00", 180)]).lastHour).toBe(24);
  });
});

describe("offsetOf and isWithin", () => {
  const range = { firstHour: 8, lastHour: 19 };

  it("places a time proportionally to the hour height", () => {
    expect(offsetOf(minutesOf("08:00"), range, 64)).toBe(0);
    expect(offsetOf(minutesOf("09:30"), range, 64)).toBe(96);
  });

  it("tells whether a time is inside the grid, bounds included", () => {
    expect(isWithin(minutesOf("08:00"), range)).toBe(true);
    expect(isWithin(minutesOf("19:00"), range)).toBe(true);
    expect(isWithin(minutesOf("07:59"), range)).toBe(false);
    expect(isWithin(minutesOf("19:01"), range)).toBe(false);
  });
});

describe("placeSlots", () => {
  it("gives the full width to visits that do not overlap", () => {
    expect(placementsById([slot("a", "09:00"), slot("b", "11:00")])).toEqual({
      a: { lane: 0, laneCount: 1, cluster: 0 },
      b: { lane: 0, laneCount: 1, cluster: 1 },
    });
  });

  it("does not treat back-to-back visits as overlapping", () => {
    expect(placementsById([slot("a", "09:00"), slot("b", "10:00")])).toEqual({
      a: { lane: 0, laneCount: 1, cluster: 0 },
      b: { lane: 0, laneCount: 1, cluster: 1 },
    });
  });

  it("places overlapping visits side by side", () => {
    expect(placementsById([slot("a", "09:00"), slot("b", "09:30")])).toEqual({
      a: { lane: 0, laneCount: 2, cluster: 0 },
      b: { lane: 1, laneCount: 2, cluster: 0 },
    });
  });

  it("reuses a lane once it is free", () => {
    expect(
      placementsById([slot("long", "09:00", 120), slot("b", "09:15", 45), slot("c", "10:00", 30)]),
    ).toEqual({
      long: { lane: 0, laneCount: 2, cluster: 0 },
      b: { lane: 1, laneCount: 2, cluster: 0 },
      c: { lane: 1, laneCount: 2, cluster: 0 },
    });
  });

  it("places visits whatever their input order", () => {
    const shuffled = placementsById([slot("b", "09:30"), slot("c", "14:00"), slot("a", "09:00")]);
    expect(shuffled).toEqual({
      a: { lane: 0, laneCount: 2, cluster: 0 },
      b: { lane: 1, laneCount: 2, cluster: 0 },
      c: { lane: 0, laneCount: 1, cluster: 1 },
    });
  });

  it("never puts two overlapping visits in the same lane", () => {
    const slots = [
      slot("a", "08:00", 90),
      slot("b", "08:30", 30),
      slot("c", "08:45", 60),
      slot("d", "09:00", 15),
      slot("e", "09:10", 120),
      slot("f", "10:00", 30),
    ];
    const placed = placeSlots(slots);
    const clashes = placed.flatMap((first, index) =>
      placed
        .slice(index + 1)
        .filter((second) => second.lane === first.lane && overlaps(first.slot, second.slot)),
    );
    expect(placed).toHaveLength(slots.length);
    expect(clashes).toEqual([]);
  });
});

describe("fitLanes", () => {
  const crowdedSlots = [
    slot("a", "09:00"),
    slot("b", "09:00"),
    slot("c", "09:15"),
    slot("d", "09:30"),
    slot("lonely", "14:00"),
  ];

  it("keeps every visit when the lanes fit", () => {
    const placed = placeSlots(crowdedSlots);
    const fitted = fitLanes(placed, 4);
    expect(fitted.visible).toEqual(placed);
    expect(fitted.crowded).toEqual([]);
  });

  it("groups the visits beyond the last lane into a +N", () => {
    const fitted = fitLanes(placeSlots(crowdedSlots), 3);
    expect(fitted.visible.map(({ slot: { id } }) => id).toSorted()).toEqual(["a", "b", "lonely"]);
    expect(fitted.crowded).toEqual([
      {
        cluster: 0,
        hidden: [crowdedSlots[2], crowdedSlots[3]],
        startMinutes: minutesOf("09:15"),
      },
    ]);
  });

  it("narrows the crowded cluster to the maximum number of lanes", () => {
    const fitted = fitLanes(placeSlots(crowdedSlots), 3);
    const laneCounts = Object.fromEntries(
      fitted.visible.map(({ slot: { id }, laneCount }) => [id, laneCount]),
    );
    expect(laneCounts).toEqual({ a: 3, b: 3, lonely: 1 });
    expect(fitted.visible.every(({ lane }) => lane < 2)).toBe(true);
  });

  it("hides every visit beyond the first lane when only two lanes fit", () => {
    const fitted = fitLanes(placeSlots(crowdedSlots), 2);
    expect(fitted.visible.map(({ slot: { id } }) => id).toSorted()).toEqual(["a", "lonely"]);
    expect(fitted.crowded[0]?.hidden).toHaveLength(3);
  });

  it("counts each crowded cluster separately", () => {
    const fitted = fitLanes(
      placeSlots([
        slot("a", "09:00"),
        slot("b", "09:00"),
        slot("c", "09:00"),
        slot("d", "15:00"),
        slot("e", "15:00"),
        slot("f", "15:30"),
      ]),
      2,
    );
    expect(fitted.crowded.map(({ hidden }) => hidden.length)).toEqual([2, 2]);
    expect(fitted.crowded.map(({ startMinutes }) => startMinutes)).toEqual([
      minutesOf("09:00"),
      minutesOf("15:00"),
    ]);
  });

  it("keeps every visit either shown or counted in a +N", () => {
    const placed = placeSlots(crowdedSlots);
    const fitted = fitLanes(placed, 3);
    const hiddenCount = fitted.crowded.reduce((total, { hidden }) => total + hidden.length, 0);
    expect(fitted.visible.length + hiddenCount).toBe(placed.length);
  });
});
