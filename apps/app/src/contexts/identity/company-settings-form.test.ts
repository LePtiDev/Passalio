import { describe, expect, it } from "vitest";
import { documentSettings } from "@/test-support/settings-replies";
import { organizationProfile } from "@/test-support/identity-replies";
import {
  companySettingsChanges,
  companySettingsOf,
  companySettingsSchema,
  type CompanySettingsValues,
} from "./company-settings-form";
import { settingsFr } from "./settings-fr";

const text = settingsFr.company.errors;

const VALID: CompanySettingsValues = {
  name: "Ramonage Dupont",
  legalForm: "sarl",
  siret: "123 456 789 00012",
  shareCapital: "5 000",
  registryKind: "rcs",
  registryCity: "Lyon",
  apeCode: "43.22B",
  address: "12 rue des Lilas, 69003 Lyon",
};

const errorsOf = (values: CompanySettingsValues) => {
  const result = companySettingsSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("companySettingsSchema", () => {
  it("accepts complete legal details written with spaces and dots", () => {
    expect(errorsOf(VALID)).toEqual({});
  });

  it("requires the legal form, the registry and a 14-digit SIRET", () => {
    expect(errorsOf({ ...VALID, legalForm: null, registryKind: null, siret: "1234" })).toEqual({
      legalForm: text.legalForm,
      registryKind: text.registry,
      siret: text.siret,
    });
  });

  it("requires the share capital of a company but not of a sole trader", () => {
    expect(errorsOf({ ...VALID, shareCapital: "" })).toEqual({ shareCapital: text.shareCapital });
    expect(errorsOf({ ...VALID, legalForm: "ei", shareCapital: "" })).toEqual({});
  });

  it("requires the city of the RCS registry only", () => {
    expect(errorsOf({ ...VALID, registryCity: "" })).toEqual({ registryCity: text.registryCity });
    expect(errorsOf({ ...VALID, registryKind: "rne", registryCity: "" })).toEqual({});
  });

  it("refuses a malformed APE code and a missing address", () => {
    expect(errorsOf({ ...VALID, apeCode: "43B", address: " " })).toEqual({
      apeCode: text.apeCode,
      address: text.address,
    });
  });
});

describe("companySettingsChanges", () => {
  it("sends digits only and drops the RCS city for the national register", () => {
    expect(companySettingsChanges(VALID)).toEqual({
      name: "Ramonage Dupont",
      legalForm: "sarl",
      siret: "12345678900012",
      shareCapitalEuros: 5000,
      registryKind: "rcs",
      registryCity: "Lyon",
      apeCode: "43.22B",
      address: "12 rue des Lilas, 69003 Lyon",
    });
    expect(
      companySettingsChanges({ ...VALID, registryKind: "rne", shareCapital: "", apeCode: "" }),
    ).toMatchObject({ registryCity: null, shareCapitalEuros: null, apeCode: null });
  });

  it("starts from the saved organization", () => {
    expect(
      companySettingsOf(
        organizationProfile({ siret: null, address: null }),
        documentSettings({
          legalForm: null,
          shareCapitalEuros: null,
          registryCity: null,
          apeCode: null,
        }),
      ),
    ).toEqual({
      name: "Ramonage Dupont",
      legalForm: null,
      siret: "",
      shareCapital: "",
      registryKind: "rcs",
      registryCity: "",
      apeCode: "",
      address: "",
    });
  });
});
