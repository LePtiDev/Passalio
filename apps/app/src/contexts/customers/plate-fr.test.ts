import { describe, expect, it } from "vitest";
import { plateFr } from "./plate-fr";

describe("plateFr", () => {
  it.each([
    [["serialNumber"], "Le numéro de série est illisible : saisissez-le à la main."],
    [["brand"], "La marque est illisible : saisissez-la à la main."],
    [
      ["brand", "serialNumber"],
      "La marque et le numéro de série sont illisibles : saisissez-les à la main.",
    ],
    [
      ["brand", "model", "serialNumber"],
      "La marque, le modèle et le numéro de série sont illisibles : saisissez-les à la main.",
    ],
  ] as const)("names the fields not read: %j", (missing, sentence) => {
    expect(plateFr.partialText(missing)).toBe(
      `${sentence} Vérifiez les autres avant d'enregistrer.`,
    );
  });

  it("counts the fields read", () => {
    expect(plateFr.readTitle(1)).toBe("1 champ lu sur la plaque");
    expect(plateFr.readTitle(5)).toBe("5 champs lus sur la plaque");
  });

  it("gives the daily limit", () => {
    expect(plateFr.limitText(200)).toMatch(/^Votre entreprise a fait 200 lectures aujourd'hui\./);
  });
});
