import { describe, expect, it } from "vitest";
import { agendasOf, agendasParam, newVisitSearch, planningSearch } from "./planning-search";

describe("planningSearch", () => {
  it("reads a valid day, view, agendas and visit", () => {
    expect(
      planningSearch.parse({
        jour: "2026-10-23",
        vue: "semaine",
        agendas: "user-1.user-2",
        passage: "visit-1",
      }),
    ).toEqual({ jour: "2026-10-23", vue: "semaine", agendas: "user-1.user-2", passage: "visit-1" });
  });

  it("accepts an empty search", () => {
    expect(planningSearch.parse({})).toEqual({});
  });

  it("ignores a day that is not a date, without failing", () => {
    expect(planningSearch.parse({ jour: "demain", vue: "jour" })).toEqual({
      jour: undefined,
      vue: "jour",
    });
    expect(planningSearch.parse({ jour: 20261023 }).jour).toBeUndefined();
  });

  it("ignores a day that does not exist on the calendar", () => {
    expect(planningSearch.parse({ jour: "2026-02-30" }).jour).toBeUndefined();
    expect(planningSearch.parse({ jour: "2026-13-01" }).jour).toBeUndefined();
  });

  it("ignores an unknown view", () => {
    expect(planningSearch.parse({ vue: "mois" }).vue).toBeUndefined();
  });

  it("ignores agendas and visit ids that are too long", () => {
    const parsed = planningSearch.parse({ agendas: "a".repeat(2001), passage: "p".repeat(65) });
    expect(parsed.agendas).toBeUndefined();
    expect(parsed.passage).toBeUndefined();
  });

  it("ignores values of the wrong type", () => {
    expect(planningSearch.parse({ agendas: ["user-1"], passage: 12, vue: true })).toEqual({
      agendas: undefined,
      passage: undefined,
      vue: undefined,
    });
  });
});

describe("newVisitSearch", () => {
  it("reads the day, customer and technician", () => {
    expect(
      newVisitSearch.parse({ jour: "2026-10-23", client: "customer-1", technicien: "user-2" }),
    ).toEqual({ jour: "2026-10-23", client: "customer-1", technicien: "user-2" });
  });

  it("ignores invalid values without failing", () => {
    expect(
      newVisitSearch.parse({ jour: "23/10/2026", client: "c".repeat(65), technicien: 4 }),
    ).toEqual({ jour: undefined, client: undefined, technicien: undefined });
  });
});

describe("agendas", () => {
  it("shows every agenda when the parameter is missing", () => {
    expect(agendasOf({})).toBeUndefined();
  });

  it("splits the agendas on dots", () => {
    expect(agendasOf({ agendas: "user-1.user-2" })).toEqual(["user-1", "user-2"]);
  });

  it("drops empty agenda ids", () => {
    expect(agendasOf({ agendas: ".user-1..user-2." })).toEqual(["user-1", "user-2"]);
  });

  it("keeps an empty selection when every agenda is unchecked", () => {
    expect(agendasOf({ agendas: "" })).toEqual([]);
  });

  it("leaves the parameter out when every agenda is selected", () => {
    expect(agendasParam(["user-2", "user-1"], ["user-1", "user-2"])).toBeUndefined();
  });

  it("joins a partial selection with dots", () => {
    expect(agendasParam(["user-1", "user-3"], ["user-1", "user-2", "user-3"])).toBe(
      "user-1.user-3",
    );
  });

  it("round-trips a partial selection through the URL", () => {
    const selection = ["user-1", "user-3"];
    const agendas = agendasParam(selection, ["user-1", "user-2", "user-3"]);
    expect(agendasOf(planningSearch.parse({ agendas }))).toEqual(selection);
  });
});
