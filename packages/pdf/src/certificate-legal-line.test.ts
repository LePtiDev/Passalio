import type { ChimneySweepingCertificate } from "@passalio/trades";
import { describe, expect, it } from "vitest";
import { sampleCertificate } from "./certificate-pdf-fixture";
import { legalLineOf } from "./certificate-legal-line";

const lineOf = (company: Partial<ChimneySweepingCertificate["company"]>) =>
  legalLineOf({ ...sampleCertificate().company, ...company }).replaceAll(" ", " ");

describe("legalLineOf", () => {
  it("writes the company name, form, capital, SIREN, RCS city and head office (R. 123-237 and R. 123-238)", () => {
    expect(lineOf({})).toBe(
      "Ramonage Dupont SAS au capital de 5 000 € · SIREN 912 345 678 RCS Créteil · siège : 12 rue des Tilleuls, 94100 Saint-Maur-des-Fossés",
    );
  });

  it("writes EI right after the name of a sole trader, without capital", () => {
    expect(
      lineOf({
        name: "Jean Dupont",
        legalForm: "ei",
        shareCapitalEuros: null,
        registry: { kind: "rne" },
      }),
    ).toBe(
      "Jean Dupont EI · SIREN 912 345 678 RNE · siège : 12 rue des Tilleuls, 94100 Saint-Maur-des-Fossés",
    );
  });

  it("does not repeat the form when the name already carries it", () => {
    expect(lineOf({ name: "Dupont Ramonage SARL", legalForm: "sarl" })).toMatch(
      /^Dupont Ramonage SARL au capital/,
    );
  });

  it("writes the SARL form and its capital", () => {
    expect(lineOf({ legalForm: "sarl", shareCapitalEuros: 1500 })).toMatch(
      /^Ramonage Dupont SARL au capital de 1 500 €/,
    );
  });

  it("writes no form label for another legal form", () => {
    expect(lineOf({ legalForm: "other", shareCapitalEuros: null })).toMatch(
      /^Ramonage Dupont · SIREN/,
    );
  });

  it("writes RNE for a company registered only at the national register", () => {
    expect(lineOf({ registry: { kind: "rne" } })).toContain("SIREN 912 345 678 RNE");
  });
});
