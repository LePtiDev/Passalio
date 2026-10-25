import { describe, expect, it } from "vitest";
import { normalizeDocumentProfileChanges } from "./document-profile";

describe("normalizeDocumentProfileChanges", () => {
  it("keeps only the fields sent", () => {
    expect(normalizeDocumentProfileChanges({ documentTemplate: "plain" })).toEqual({
      isOk: true,
      value: { documentTemplate: "plain" },
    });
  });

  it("trims texts and clears the ones sent blank", () => {
    expect(
      normalizeDocumentProfileChanges({
        registryCity: "  Créteil ",
        qualification: " ",
        contactEmail: " contact@ramonage-dupont.fr ",
        website: "",
        customerMessage: " Merci ! ",
        footerText: null,
      }),
    ).toEqual({
      isOk: true,
      value: {
        registryCity: "Créteil",
        qualification: null,
        contactEmail: "contact@ramonage-dupont.fr",
        website: null,
        customerMessage: "Merci !",
        footerText: null,
      },
    });
  });

  it("keeps the legal form, capital and registry as sent", () => {
    expect(
      normalizeDocumentProfileChanges({
        legalForm: "sarl",
        shareCapitalEuros: 7500,
        registryKind: "rcs",
      }),
    ).toEqual({
      isOk: true,
      value: {
        legalForm: "sarl",
        shareCapitalEuros: 7500,
        registryKind: "rcs",
      },
    });
  });

  it.each([
    ["4322B", "4322B"],
    ["43.22b", "4322B"],
    [" 4322 B ", "4322B"],
  ])("writes the APE code %s as %s", (raw, code) => {
    expect(normalizeDocumentProfileChanges({ apeCode: raw })).toEqual({
      isOk: true,
      value: { apeCode: code },
    });
  });

  it("clears an APE code sent blank", () => {
    expect(normalizeDocumentProfileChanges({ apeCode: " " })).toEqual({
      isOk: true,
      value: { apeCode: null },
    });
  });

  it.each(["4322", "43222", "ABCDE", "4322BB"])("refuses the APE code %s", (raw) => {
    expect(normalizeDocumentProfileChanges({ apeCode: raw })).toEqual({
      isOk: false,
      error: "invalid_ape_code",
    });
  });
});
