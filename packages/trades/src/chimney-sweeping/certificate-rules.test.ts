import { describe, expect, it } from "vitest";
import { checkCertificate, type SweptEquipment } from "./certificate-rules";
import { validCertificate } from "./certificate-fixture";

const insert: SweptEquipment = { kind: "insert", flueType: "lined_masonry" };
const sealedBoiler: SweptEquipment = { kind: "boiler", flueType: "sealed_concentric" };
const oilBoiler: SweptEquipment = { kind: "boiler", flueType: "masonry" };

const boilerCertificate = (sweepingExtent: "full_length" | "sealed_appliance") =>
  validCertificate({
    equipment: {
      kind: "boiler",
      energy: "gas",
      brand: null,
      model: null,
      serialNumber: null,
      flueType: sweepingExtent === "sealed_appliance" ? "sealed_concentric" : "masonry",
    },
    sweepingExtent,
    isAdviceAttached: false,
  });

const errorOf = (data: unknown, equipment: SweptEquipment = insert) => {
  const checked = checkCertificate(data, equipment);
  return checked.isOk ? "ok" : checked.error;
};

describe("checkCertificate", () => {
  it("accepts a full length sweeping of an insert with the usage advice", () => {
    expect(errorOf(validCertificate())).toBe("ok");
  });

  it("refuses a certificate without any identified flue", () => {
    expect(errorOf(validCertificate({ flues: [] }))).toBe("invalid_certificate");
  });

  it("refuses a certificate whose equipment is not the swept one", () => {
    expect(errorOf(validCertificate(), { kind: "log_stove", flueType: null })).toBe(
      "equipment_mismatch",
    );
  });

  it("requires the unswept part when the sweeping is partial", () => {
    expect(errorOf(validCertificate({ sweepingExtent: "partial" }))).toBe("unswept_part_required");
    expect(
      errorOf(validCertificate({ sweepingExtent: "partial", unsweptPart: "Partie en combles" })),
    ).toBe("ok");
  });

  it("never states the full length vacuity of a sealed gas appliance", () => {
    expect(errorOf(boilerCertificate("full_length"), sealedBoiler)).toBe(
      "sweeping_extent_mismatch",
    );
    expect(errorOf(boilerCertificate("sealed_appliance"), sealedBoiler)).toBe("ok");
  });

  it("refuses the sealed appliance wording for a flue that is not sealed", () => {
    expect(errorOf(boilerCertificate("sealed_appliance"), oilBoiler)).toBe(
      "sweeping_extent_mismatch",
    );
  });

  it("requires the usage advice for a solid fuel appliance but not for a boiler", () => {
    expect(errorOf(validCertificate({ isAdviceAttached: false }))).toBe("advice_required");
    expect(errorOf(boilerCertificate("full_length"), oilBoiler)).toBe("ok");
  });

  it("requires the share capital of a limited company", () => {
    const company = { ...validCertificate().company, shareCapitalEuros: null };
    expect(errorOf(validCertificate({ company }))).toBe("share_capital_required");
    expect(errorOf(validCertificate({ company: { ...company, legalForm: "ei" } }))).toBe("ok");
  });

  it("requires the customer signature unless the customer is absent", () => {
    expect(errorOf(validCertificate({ customerSignature: null }))).toBe(
      "customer_signature_required",
    );
    expect(errorOf(validCertificate({ customerSignature: null, isCustomerAbsent: true }))).toBe(
      "ok",
    );
  });

  it("refuses a completion date before the visit", () => {
    expect(errorOf(validCertificate({ completedOn: "2026-10-22" }))).toBe("completed_before_visit");
  });

  it("refuses a signature that is not a PNG image", () => {
    expect(
      errorOf(validCertificate({ technicianSignature: "data:image/svg+xml;base64,AAAA" })),
    ).toBe("invalid_certificate");
  });

  it("refuses unknown fields so that nothing unchecked reaches the signed document", () => {
    expect(errorOf({ ...validCertificate(), fineAmount: 450 })).toBe("invalid_certificate");
  });
});
