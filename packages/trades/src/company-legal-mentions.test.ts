import { describe, expect, it } from "vitest";
import {
  certificateCompanyOf,
  missingLegalMentions,
  type CompanyLegalDetails,
} from "./company-legal-mentions";

const COMPLETE: CompanyLegalDetails = {
  name: "Ramonage Dupont",
  legalForm: "sas",
  shareCapitalEuros: 5000,
  siret: "91234567800018",
  registryKind: "rcs",
  registryCity: "Créteil",
  address: "12 rue des Tilleuls, 94100 Saint-Maur-des-Fossés",
  phone: "01 45 00 00 00",
  qualification: "Qualibat 5131",
};

const EMPTY: CompanyLegalDetails = {
  name: "Ramonage Dupont",
  legalForm: null,
  shareCapitalEuros: null,
  siret: null,
  registryKind: null,
  registryCity: null,
  address: null,
  phone: null,
  qualification: null,
};

describe("missingLegalMentions", () => {
  it("finds nothing missing on a complete company", () => {
    expect(missingLegalMentions(COMPLETE)).toEqual([]);
  });

  it("lists every mention of a company created without its legal details", () => {
    expect(missingLegalMentions(EMPTY)).toEqual(["legalForm", "siret", "registry", "address"]);
  });

  it("asks for the share capital of a company form", () => {
    expect(missingLegalMentions({ ...COMPLETE, shareCapitalEuros: null })).toEqual([
      "shareCapitalEuros",
    ]);
  });

  it("does not ask a sole trader for a share capital", () => {
    expect(
      missingLegalMentions({
        ...COMPLETE,
        legalForm: "ei",
        shareCapitalEuros: null,
        registryKind: "rne",
        registryCity: null,
      }),
    ).toEqual([]);
  });

  it("asks for the registry city of an RCS registration", () => {
    expect(missingLegalMentions({ ...COMPLETE, registryCity: "  " })).toEqual(["registry"]);
  });

  it("refuses a SIRET that is not 14 digits", () => {
    expect(missingLegalMentions({ ...COMPLETE, siret: "9123456780001" })).toEqual(["siret"]);
  });

  it("refuses a blank name or address", () => {
    expect(missingLegalMentions({ ...COMPLETE, name: " ", address: "" })).toEqual([
      "name",
      "address",
    ]);
  });
});

describe("certificateCompanyOf", () => {
  it("builds the company block of the certificate with the SIREN taken from the SIRET", () => {
    expect(certificateCompanyOf(COMPLETE)).toEqual({
      isOk: true,
      value: {
        name: "Ramonage Dupont",
        legalForm: "sas",
        shareCapitalEuros: 5000,
        siren: "912345678",
        registry: { kind: "rcs", city: "Créteil" },
        address: "12 rue des Tilleuls, 94100 Saint-Maur-des-Fossés",
        phone: "01 45 00 00 00",
        qualification: "Qualibat 5131",
      },
    });
  });

  it("drops the registry city of an RNE registration", () => {
    const result = certificateCompanyOf({
      ...COMPLETE,
      legalForm: "ei",
      shareCapitalEuros: null,
      registryKind: "rne",
    });
    expect(result).toMatchObject({ isOk: true, value: { registry: { kind: "rne" } } });
  });

  it("refuses an incomplete company", () => {
    expect(certificateCompanyOf(EMPTY)).toEqual({ isOk: false, error: "company_incomplete" });
  });
});
