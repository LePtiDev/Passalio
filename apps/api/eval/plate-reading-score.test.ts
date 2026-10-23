import { describe, expect, it } from "vitest";
import { type ExpectedPlate, scorePlate, summarize } from "./plate-reading-score";

const BOILER: ExpectedPlate = {
  file: "boiler.jpg",
  kind: "boiler",
  energy: "gas",
  brand: "Saunier Duval",
  model: "SD 223 C",
  serialNumber: "90482775",
  powerKw: 23.3,
  refrigerant: null,
  refrigerantChargeKg: null,
  difficulty: "easy",
};

const outcomesOf = (expected: ExpectedPlate, read: Parameters<typeof scorePlate>[1]) =>
  Object.fromEntries(
    scorePlate(expected, read).fields.map(({ field, outcome }) => [field, outcome]),
  );

describe("scorePlate", () => {
  it("counts a field as correct regardless of case, spaces, dashes, dots and slashes", () => {
    expect(
      outcomesOf(BOILER, {
        kind: "boiler",
        energy: "gas",
        brand: "SAUNIER-DUVAL",
        model: "sd223c",
        serialNumber: "9048 2775",
        powerKw: 23.3,
      }),
    ).toEqual({
      kind: "correct",
      energy: "correct",
      brand: "correct",
      model: "correct",
      serialNumber: "correct",
      powerKw: "correct",
      refrigerant: "absent",
      refrigerantChargeKg: "absent",
    });
  });

  it("accepts a number within 1 %", () => {
    expect(outcomesOf(BOILER, { powerKw: 23.5 }).powerKw).toBe("correct");
    expect(outcomesOf(BOILER, { powerKw: 24 }).powerKw).toBe("wrong");
  });

  it("separates a missed field, a wrong one and an invented one", () => {
    const outcomes = outcomesOf(BOILER, { brand: "Frisquet", refrigerant: "R32" });
    expect(outcomes.model).toBe("missed");
    expect(outcomes.brand).toBe("wrong");
    expect(outcomes.refrigerant).toBe("invented");
  });

  it("accepts an alternative kind when the photo allows both", () => {
    const insert = { ...BOILER, kind: "insert", kindAlternatives: ["log_stove"] };
    expect(outcomesOf(insert, { kind: "log_stove" }).kind).toBe("correct");
    expect(outcomesOf(insert, { kind: "boiler" }).kind).toBe("wrong");
  });
});

describe("summarize", () => {
  it("gives the accuracy over the fields that were expected or invented", () => {
    const scores = [
      scorePlate(BOILER, { brand: "Saunier Duval", model: "SD 223 C", refrigerant: "R32" }),
    ];
    expect(summarize(scores)).toEqual({
      correct: 2,
      missed: 4,
      wrong: 0,
      invented: 1,
      accuracy: 2 / 7,
    });
  });

  it("gives zero without any judged field", () => {
    expect(summarize([])).toEqual({ correct: 0, missed: 0, wrong: 0, invented: 0, accuracy: 0 });
  });
});
