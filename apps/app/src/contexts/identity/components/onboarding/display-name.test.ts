import { describe, expect, it } from "vitest";
import { formatSiret, toDisplayName } from "./display-name";

describe("toDisplayName", () => {
  it("turns a Sirene name into a readable name", () => {
    expect(toDisplayName("RAMONAGE DUPONT ET FILS")).toBe("Ramonage Dupont et Fils");
  });

  it("keeps hyphens and apostrophes", () => {
    expect(toDisplayName("12 RUE DE L'ÉGLISE 69100 VILLEURBANNE-CENTRE")).toBe(
      "12 Rue de L'Église 69100 Villeurbanne-Centre",
    );
  });
});

describe("formatSiret", () => {
  it("groups the 14 digits", () => {
    expect(formatSiret("12345678900012")).toBe("123 456 789 00012");
  });
});
