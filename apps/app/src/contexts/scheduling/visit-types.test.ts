import { TRADE_IDS, type TradeId } from "@passalio/trades";
import { describe, expect, it } from "vitest";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import {
  chosenVisitTypes,
  DURATION_CHOICES,
  inTradeOrder,
  steppedDuration,
  suggestedVisitTypes,
  toggledVisitType,
  usualMinutesOf,
} from "./visit-types";

const DEFAULT_MINUTES: Readonly<Record<TradeId, number>> = {
  chimney_sweeping: 60,
  stove_maintenance: 90,
  boiler_maintenance: 60,
  heat_pump_maintenance: 90,
  septic_tank_emptying: 120,
};

const offeredOf = (...types: TradeId[]): VisitTypeRecord[] =>
  types.map((type) => ({ type, minutes: DEFAULT_MINUTES[type] }));

const ALL_TYPES = offeredOf(...TRADE_IDS);

describe("DURATION_CHOICES", () => {
  it("goes from 15 minutes to 8 hours by steps of 15 minutes", () => {
    expect(DURATION_CHOICES[0]).toBe(15);
    expect(DURATION_CHOICES.at(-1)).toBe(480);
    expect(DURATION_CHOICES).toHaveLength(32);
    expect(DURATION_CHOICES.every((minutes, index) => minutes === 15 * (index + 1))).toBe(true);
  });

  it("offers every default duration", () => {
    expect(
      Object.values(DEFAULT_MINUTES).every((minutes) => DURATION_CHOICES.includes(minutes)),
    ).toBe(true);
  });
});

describe("steppedDuration", () => {
  it("adds or removes 15 minutes per step", () => {
    expect(steppedDuration(60, 1)).toBe(75);
    expect(steppedDuration(60, -1)).toBe(45);
    expect(steppedDuration(60, 4)).toBe(120);
  });

  it("never goes under 15 minutes", () => {
    expect(steppedDuration(15, -1)).toBe(15);
    expect(steppedDuration(30, -5)).toBe(15);
  });

  it("never goes over 8 hours", () => {
    expect(steppedDuration(480, 1)).toBe(480);
    expect(steppedDuration(465, 3)).toBe(480);
  });
});

describe("inTradeOrder", () => {
  it("sorts visit types in the trade catalog order", () => {
    expect(
      inTradeOrder(offeredOf("septic_tank_emptying", "chimney_sweeping", "boiler_maintenance")).map(
        ({ type }) => type,
      ),
    ).toEqual(["chimney_sweeping", "boiler_maintenance", "septic_tank_emptying"]);
  });

  it("leaves the given list untouched", () => {
    const given = offeredOf("stove_maintenance", "chimney_sweeping");
    inTradeOrder(given);
    expect(given.map(({ type }) => type)).toEqual(["stove_maintenance", "chimney_sweeping"]);
  });
});

describe("suggestedVisitTypes", () => {
  it("chooses chimney sweeping for a log stove, the first trade of its kind", () => {
    expect(suggestedVisitTypes(ALL_TYPES, ["log_stove"])).toEqual(["chimney_sweeping"]);
  });

  it("chooses boiler maintenance for a boiler", () => {
    expect(suggestedVisitTypes(ALL_TYPES, ["boiler"])).toEqual(["boiler_maintenance"]);
  });

  it("chooses heat pump maintenance for an air conditioner", () => {
    expect(suggestedVisitTypes(ALL_TYPES, ["air_conditioner"])).toEqual(["heat_pump_maintenance"]);
  });

  it("skips the trades the company does not offer", () => {
    expect(
      suggestedVisitTypes(offeredOf("stove_maintenance", "boiler_maintenance"), ["pellet_stove"]),
    ).toEqual(["stove_maintenance"]);
    expect(
      suggestedVisitTypes(offeredOf("chimney_sweeping", "stove_maintenance"), ["boiler"]),
    ).toEqual(["chimney_sweeping"]);
  });

  it("keeps one main trade per equipment, in trade order", () => {
    expect(
      suggestedVisitTypes(ALL_TYPES, ["air_to_water_heat_pump", "log_stove", "boiler"]),
    ).toEqual(["chimney_sweeping", "boiler_maintenance", "heat_pump_maintenance"]);
  });

  it("chooses a type once for several equipments of the same trade", () => {
    expect(suggestedVisitTypes(ALL_TYPES, ["log_stove", "open_fireplace", "insert"])).toEqual([
      "chimney_sweeping",
    ]);
  });

  it("chooses the only type of the company when no equipment matches", () => {
    expect(suggestedVisitTypes(offeredOf("chimney_sweeping"), [])).toEqual(["chimney_sweeping"]);
    expect(suggestedVisitTypes(offeredOf("chimney_sweeping"), ["air_conditioner"])).toEqual([
      "chimney_sweeping",
    ]);
  });

  it("chooses nothing when no equipment matches and the company offers several types", () => {
    expect(suggestedVisitTypes(offeredOf("chimney_sweeping", "boiler_maintenance"), [])).toEqual(
      [],
    );
    expect(
      suggestedVisitTypes(offeredOf("chimney_sweeping", "boiler_maintenance"), ["air_conditioner"]),
    ).toEqual([]);
  });

  it("chooses nothing when the company offers no type", () => {
    expect(suggestedVisitTypes([], ["log_stove"])).toEqual([]);
  });
});

describe("chosenVisitTypes", () => {
  it("keeps the offered types that are chosen, with their durations", () => {
    expect(chosenVisitTypes(ALL_TYPES, ["stove_maintenance", "chimney_sweeping"])).toEqual([
      { type: "chimney_sweeping", minutes: 60 },
      { type: "stove_maintenance", minutes: 90 },
    ]);
  });

  it("ignores a chosen type the company no longer offers", () => {
    expect(chosenVisitTypes(offeredOf("chimney_sweeping"), ["septic_tank_emptying"])).toEqual([]);
  });
});

describe("usualMinutesOf", () => {
  it("adds the durations of the chosen types", () => {
    expect(usualMinutesOf(offeredOf("chimney_sweeping", "stove_maintenance"))).toBe(150);
  });

  it("is zero without type", () => {
    expect(usualMinutesOf([])).toBe(0);
  });
});

describe("toggledVisitType", () => {
  it("adds an unchosen type, keeping the trade order", () => {
    expect(toggledVisitType(["boiler_maintenance"], "chimney_sweeping")).toEqual([
      "chimney_sweeping",
      "boiler_maintenance",
    ]);
  });

  it("removes a chosen type", () => {
    expect(toggledVisitType(["chimney_sweeping", "stove_maintenance"], "chimney_sweeping")).toEqual(
      ["stove_maintenance"],
    );
  });

  it("can leave no type chosen", () => {
    expect(toggledVisitType(["chimney_sweeping"], "chimney_sweeping")).toEqual([]);
  });
});
