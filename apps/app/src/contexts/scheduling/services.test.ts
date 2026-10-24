import { describe, expect, it } from "vitest";
import type { ServiceRecord } from "@/lib/db/local-records";
import {
  chosenServices,
  DURATION_CHOICES,
  SERVICE_DURATION_CHOICES,
  serviceLinesOf,
  suggestedServiceIds,
  toggledServiceId,
  usualDurationOf,
  usualMinutesOf,
  usualPriceCentsOf,
  visitTypesOf,
} from "./services";

const serviceOf = (id: string, overrides: Partial<ServiceRecord> = {}): ServiceRecord => ({
  id,
  name: `Prestation ${id}`,
  durationMinutes: 60,
  priceCents: 8000,
  document: "none",
  trade: null,
  ...overrides,
});

const sweeping = serviceOf("sweeping", {
  name: "Ramonage",
  trade: "chimney_sweeping",
  document: "chimney_sweeping_certificate",
});
const secondSweeping = serviceOf("sweeping-2", {
  name: "Ramonage tubé",
  trade: "chimney_sweeping",
  priceCents: 9500,
});
const stove = serviceOf("stove", {
  name: "Entretien poêle",
  durationMinutes: 90,
  priceCents: null,
  trade: "stove_maintenance",
});
const boiler = serviceOf("boiler", {
  name: "Entretien chaudière",
  trade: "boiler_maintenance",
  priceCents: 12000,
});
const heatPump = serviceOf("heat-pump", {
  name: "Entretien PAC",
  durationMinutes: 120,
  trade: "heat_pump_maintenance",
});
const relining = serviceOf("relining", {
  name: "Tubage",
  durationMinutes: 2 * 1440,
  priceCents: null,
});

const OFFERED = [sweeping, secondSweeping, stove, boiler, heatPump, relining];

describe("DURATION_CHOICES", () => {
  it("offers every quarter of an hour from 15 minutes to 8 hours", () => {
    expect(DURATION_CHOICES[0]).toBe(15);
    expect(DURATION_CHOICES.at(-1)).toBe(480);
    expect(DURATION_CHOICES).toHaveLength(32);
    expect(DURATION_CHOICES.every((minutes) => minutes % 15 === 0)).toBe(true);
  });
});

describe("SERVICE_DURATION_CHOICES", () => {
  it("adds one to ten whole days after the hours", () => {
    expect(SERVICE_DURATION_CHOICES.slice(0, 32)).toEqual(DURATION_CHOICES);
    expect(SERVICE_DURATION_CHOICES.slice(32)).toEqual([
      1440, 2880, 4320, 5760, 7200, 8640, 10080, 11520, 12960, 14400,
    ]);
  });
});

describe("suggestedServiceIds", () => {
  it("suggests the first service of the main trade of each equipment", () => {
    expect(suggestedServiceIds(OFFERED, ["log_stove", "air_to_water_heat_pump"])).toEqual([
      "sweeping",
      "heat-pump",
    ]);
  });

  it("suggests a single service for two equipments of the same trade", () => {
    expect(suggestedServiceIds(OFFERED, ["log_stove", "open_fireplace"])).toEqual(["sweeping"]);
  });

  it("falls back on the next trade of the equipment when the main one is not offered", () => {
    expect(suggestedServiceIds([stove, heatPump], ["log_stove"])).toEqual(["stove"]);
  });

  it("follows the order of the company's list", () => {
    expect(suggestedServiceIds([heatPump, boiler], ["boiler", "air_conditioner"])).toEqual([
      "heat-pump",
      "boiler",
    ]);
  });

  it("suggests nothing for an equipment no service covers", () => {
    expect(suggestedServiceIds([sweeping, stove], ["air_conditioner"])).toEqual([]);
  });

  it("suggests nothing without equipment when several services are offered", () => {
    expect(suggestedServiceIds(OFFERED, [])).toEqual([]);
  });

  it("suggests the only service of the company even without equipment", () => {
    expect(suggestedServiceIds([relining], [])).toEqual(["relining"]);
    expect(suggestedServiceIds([sweeping], ["air_conditioner"])).toEqual(["sweeping"]);
  });

  it("suggests nothing when the company has no service", () => {
    expect(suggestedServiceIds([], ["log_stove"])).toEqual([]);
  });

  it("never suggests a service without trade from equipments", () => {
    expect(suggestedServiceIds([relining, sweeping], ["log_stove"])).toEqual(["sweeping"]);
  });
});

describe("chosenServices", () => {
  it("returns the chosen services in the company's order", () => {
    expect(chosenServices(OFFERED, ["stove", "sweeping"])).toEqual([sweeping, stove]);
  });

  it("ignores identifiers no longer offered", () => {
    expect(chosenServices(OFFERED, ["archived", "boiler"])).toEqual([boiler]);
  });
});

describe("usualDurationOf", () => {
  it("is zero without service", () => {
    expect(usualDurationOf([])).toBe(0);
  });

  it("adds the durations of the chosen services", () => {
    expect(usualDurationOf([sweeping, stove])).toBe(150);
  });

  it("counts a service of several days as 8 hours", () => {
    expect(usualMinutesOf([relining])).toBe(480);
    expect(usualDurationOf([relining])).toBe(480);
  });

  it("never goes beyond 8 hours", () => {
    expect(usualMinutesOf([relining, stove])).toBe(570);
    expect(usualDurationOf([relining, stove])).toBe(480);
    expect(usualDurationOf([heatPump, heatPump, heatPump, heatPump, heatPump])).toBe(480);
  });
});

describe("usualPriceCentsOf", () => {
  it("adds the prices of the chosen services", () => {
    expect(usualPriceCentsOf([sweeping, boiler])).toBe(20000);
  });

  it("is on quotation when every service is on quotation", () => {
    expect(usualPriceCentsOf([stove, relining])).toBeNull();
  });

  it("adds only the known prices when some services are on quotation", () => {
    expect(usualPriceCentsOf([sweeping, stove])).toBe(8000);
  });

  it("is on quotation without service", () => {
    expect(usualPriceCentsOf([])).toBeNull();
  });

  it("counts a free service", () => {
    expect(usualPriceCentsOf([serviceOf("free", { priceCents: 0 })])).toBe(0);
  });
});

describe("toggledServiceId", () => {
  it("adds a service and keeps the company's order", () => {
    expect(toggledServiceId(OFFERED, ["boiler"], "sweeping")).toEqual(["sweeping", "boiler"]);
    expect(toggledServiceId(OFFERED, ["sweeping", "heat-pump"], "stove")).toEqual([
      "sweeping",
      "stove",
      "heat-pump",
    ]);
  });

  it("removes a service already chosen", () => {
    expect(toggledServiceId(OFFERED, ["sweeping", "stove"], "sweeping")).toEqual(["stove"]);
  });

  it("removes the last service", () => {
    expect(toggledServiceId(OFFERED, ["stove"], "stove")).toEqual([]);
  });
});

describe("serviceLinesOf", () => {
  it("freezes the name, duration and price of each chosen service", () => {
    expect(serviceLinesOf([sweeping, relining])).toEqual([
      { serviceId: "sweeping", name: "Ramonage", durationMinutes: 60, priceCents: 8000 },
      { serviceId: "relining", name: "Tubage", durationMinutes: 2880, priceCents: null },
    ]);
  });

  it("gives no line without service", () => {
    expect(serviceLinesOf([])).toEqual([]);
  });
});

describe("visitTypesOf", () => {
  it("lists the trades of the chosen services once each", () => {
    expect(visitTypesOf([sweeping, secondSweeping, stove])).toEqual([
      "chimney_sweeping",
      "stove_maintenance",
    ]);
  });

  it("ignores services without trade", () => {
    expect(visitTypesOf([relining])).toEqual([]);
    expect(visitTypesOf([relining, heatPump])).toEqual(["heat_pump_maintenance"]);
  });
});
