import { describe, expect, it } from "vitest";
import { legalLineParts, type LegalLineDraft } from "./legal-line-parts";
import { settingsFr } from "./settings-fr";

const text = settingsFr.company;

const COMPLETE: LegalLineDraft = {
  name: "Ramonage Dupont",
  legalForm: "sarl",
  siret: "123 456 789 00012",
  shareCapital: "5000",
  registryKind: "rcs",
  registryCity: "Lyon",
  address: "12 rue des Lilas, 69003 Lyon",
};

const lineOf = (draft: LegalLineDraft) =>
  legalLineParts(draft)
    .map((part) => part.text)
    .join(" ");

const missingOf = (draft: LegalLineDraft) =>
  legalLineParts(draft)
    .filter((part) => part.isMissing)
    .map((part) => part.id);

describe("legalLineParts", () => {
  it("writes the legal line of the certificate with the SIREN taken from the SIRET", () => {
    expect(lineOf(COMPLETE)).toBe(
      "Ramonage Dupont SARL au capital de 5 000 € · SIREN 123 456 789 RCS Lyon · siège : 12 rue des Lilas, 69003 Lyon",
    );
    expect(missingOf(COMPLETE)).toEqual([]);
  });

  it("writes the national register for a craftsman without share capital", () => {
    expect(
      lineOf({
        ...COMPLETE,
        legalForm: "ei",
        shareCapital: "",
        registryKind: "rne",
        registryCity: "",
      }),
    ).toBe("Ramonage Dupont EI · SIREN 123 456 789 RNE · siège : 12 rue des Lilas, 69003 Lyon");
  });

  it("marks every missing mention", () => {
    expect(
      missingOf({
        name: "",
        legalForm: null,
        siret: "1234",
        shareCapital: "",
        registryKind: null,
        registryCity: "",
        address: "",
      }),
    ).toEqual(["name", "form", "siren", "registry", "address"]);
  });

  it("asks for the share capital of a company and the city of the RCS", () => {
    const parts = legalLineParts({ ...COMPLETE, shareCapital: "", registryCity: " " });

    expect(parts.filter((part) => part.isMissing).map((part) => part.text)).toEqual([
      text.toFix,
      text.toFix,
    ]);
    expect(lineOf({ ...COMPLETE, shareCapital: "" })).toContain(
      `${text.line.capitalLabel} ${text.toFix}`,
    );
  });
});
