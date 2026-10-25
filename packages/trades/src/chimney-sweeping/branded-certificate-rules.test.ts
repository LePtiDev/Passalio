import { describe, expect, it } from "vitest";
import { LOGO_MAX_BASE64_LENGTH } from "../document-branding";
import { checkBrandedCertificate, type SweptEquipment } from "./certificate-rules";
import { sampleBranding, validBrandedCertificate, validCertificate } from "./certificate-fixture";

const insert: SweptEquipment = { kind: "insert", flueType: "lined_masonry" };

const logo = (length: number) => ({ format: "png" as const, base64: "A".repeat(length) });

const errorOf = (data: unknown) => {
  const checked = checkBrandedCertificate(data, insert);
  return checked.isOk ? "ok" : checked.error;
};

describe("checkBrandedCertificate", () => {
  it("accepts a certificate that carries the frozen company branding", () => {
    expect(errorOf(validBrandedCertificate())).toBe("ok");
  });

  it("keeps the frozen branding in the checked certificate", () => {
    const branding = sampleBranding({ template: "plain", brandColor: "#0E7C5A" });
    const checked = checkBrandedCertificate(validBrandedCertificate({ branding }), insert);
    expect(checked.isOk && checked.value.branding).toEqual(branding);
  });

  it("refuses a version 1 certificate without branding", () => {
    expect(errorOf(validCertificate())).toBe("invalid_certificate");
  });

  it("refuses an unknown template or colour", () => {
    expect(
      errorOf({ ...validBrandedCertificate(), branding: { ...sampleBranding(), template: "x" } }),
    ).toBe("invalid_certificate");
    expect(
      errorOf({
        ...validBrandedCertificate(),
        branding: { ...sampleBranding(), brandColor: "#FFFFFF" },
      }),
    ).toBe("invalid_certificate");
  });

  it("refuses a logo too large to be kept with the signed certificate", () => {
    expect(errorOf(validBrandedCertificate({ branding: sampleBranding({ logo: logo(16) }) }))).toBe(
      "ok",
    );
    expect(
      errorOf({
        ...validBrandedCertificate(),
        branding: { ...sampleBranding(), logo: logo(LOGO_MAX_BASE64_LENGTH + 1) },
      }),
    ).toBe("invalid_certificate");
  });

  it("applies the same blocking rules as version 1", () => {
    expect(errorOf(validBrandedCertificate({ sweepingExtent: "partial" }))).toBe(
      "unswept_part_required",
    );
    expect(
      errorOf(validBrandedCertificate({ customerSignature: null, isCustomerAbsent: false })),
    ).toBe("customer_signature_required");
  });
});
