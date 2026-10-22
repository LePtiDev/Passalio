import { describe, expect, it } from "vitest";
import { normalizeProfileChanges, normalizeSiret } from "./organization-profile";

describe("normalizeSiret", () => {
  it("keeps the 14 digits and drops spaces", () => {
    expect(normalizeSiret("123 456 789 00012")).toEqual({ isOk: true, value: "12345678900012" });
  });

  it("refuses a SIREN or letters", () => {
    expect(normalizeSiret("123456789").isOk).toBe(false);
    expect(normalizeSiret("1234567890001A").isOk).toBe(false);
  });
});

describe("normalizeProfileChanges", () => {
  it("trims texts, turns blanks into null and removes duplicate trades", () => {
    const result = normalizeProfileChanges({
      name: "  Ramonage   Dupont ",
      address: "  ",
      phone: " 04 78 00 00 00 ",
      siret: "",
      trades: ["chimney_sweeping", "chimney_sweeping", "stove_maintenance"],
    });
    expect(result).toEqual({
      isOk: true,
      value: {
        name: "Ramonage Dupont",
        address: null,
        phone: "04 78 00 00 00",
        siret: null,
        trades: ["chimney_sweeping", "stove_maintenance"],
      },
    });
  });

  it("refuses an invalid prefix or first number", () => {
    expect(normalizeProfileChanges({ documentNumberPrefix: "2026 ?" })).toEqual({
      isOk: false,
      error: "invalid_document_numbering",
    });
    expect(normalizeProfileChanges({ nextDocumentNumber: 0 }).isOk).toBe(false);
  });

  it("refuses a short name", () => {
    expect(normalizeProfileChanges({ name: "R" })).toEqual({
      isOk: false,
      error: "invalid_organization_name",
    });
  });
});
