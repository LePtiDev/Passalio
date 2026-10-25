import type { ChimneySweepingCertificate } from "@passalio/trades";
import { describe, expect, it } from "vitest";
import { adviceCardsOf, isAdviceDue } from "./certificate-advice";
import { sampleCertificate } from "./certificate-pdf-fixture";

type Equipment = ChimneySweepingCertificate["equipment"];

const equipment = (overrides: Partial<Equipment>): Equipment => ({
  ...sampleCertificate().equipment,
  ...overrides,
});

const textOf = (overrides: Partial<Equipment>) =>
  adviceCardsOf(equipment(overrides))
    .map((card) => `${card.title} ${card.body}`)
    .join(" ");

describe("isAdviceDue (R. 1331-77)", () => {
  it.each(["open_fireplace", "insert", "log_stove", "pellet_stove", "solid_fuel_cooker"] as const)(
    "is due for a solid fuel %s when the advice is attached",
    (kind) => {
      expect(isAdviceDue(sampleCertificate({ equipment: equipment({ kind }) }))).toBe(true);
    },
  );

  it("is not due for a boiler, excluded by R. 1331-77", () => {
    const boiler = sampleCertificate({
      equipment: equipment({ kind: "boiler", energy: "gas" }),
      isAdviceAttached: true,
    });
    expect(isAdviceDue(boiler)).toBe(false);
  });

  it("is not printed when the technician did not attach it", () => {
    expect(isAdviceDue(sampleCertificate({ isAdviceAttached: false }))).toBe(false);
  });
});

describe("adviceCardsOf (annexe 2 of the arrêté of 20 July 2023)", () => {
  const ANNEX_TWO_POINTS: readonly (readonly [string, RegExp])[] = [
    ["use and pollutant emissions", /particules polluantes|émet beaucoup de particules/],
    ["regulation and temperature control", /Régulation et température/],
    ["health risks and accidents", /monoxyde de carbone/],
    ["sweeping twice a year above 6 m³ or 2.5 t", /6 m³ de bois bûche ou 2,5 t de granulés/],
    ["fuel storage", /stocké|stockés/],
    ["adapting to real needs and reducing them", /Isoler le logement réduit vos besoins/],
    ["replacement, advice bodies and financial help", /France Rénov'.*aides financières/],
    ["sweeping before a long period without use", /avant une longue période sans feu/],
  ];

  it.each(ANNEX_TWO_POINTS)("covers %s for a wood insert", (_, pattern) => {
    expect(textOf({})).toMatch(pattern);
  });

  it.each(ANNEX_TWO_POINTS)("covers %s for a pellet stove", (_, pattern) => {
    expect(textOf({ kind: "pellet_stove", energy: "pellets" })).toMatch(pattern);
  });

  it.each(ANNEX_TWO_POINTS)("covers %s for an open fireplace", (_, pattern) => {
    expect(textOf({ kind: "open_fireplace", energy: "wood_logs" })).toMatch(pattern);
  });

  it("names the appliance in the usage card", () => {
    expect(adviceCardsOf(equipment({ kind: "log_stove" }))[0]?.title).toBe(
      "Bien utiliser votre poêle",
    );
    expect(adviceCardsOf(equipment({ kind: "solid_fuel_cooker" }))[0]?.title).toBe(
      "Bien utiliser votre cuisinière",
    );
  });

  it("gives pellet advice for a pellet stove with no energy recorded", () => {
    expect(textOf({ kind: "pellet_stove", energy: null })).toContain("Granulés certifiés");
  });

  it("gives coal advice for a coal stove", () => {
    expect(textOf({ kind: "log_stove", energy: "coal" })).toContain(
      "charbon prévu par le fabricant",
    );
  });

  it("explains that an open fireplace cannot be regulated", () => {
    expect(textOf({ kind: "open_fireplace" })).toContain("Un foyer ouvert ne se règle pas");
  });
});
