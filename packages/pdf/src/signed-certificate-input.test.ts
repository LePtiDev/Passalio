import { describe, expect, it } from "vitest";
import { sampleBranding, sampleInput } from "./certificate-pdf-fixture";
import { certificatePdfInput } from "./certificate-pdf-input";
import { signedCertificatePdfInput } from "./signed-certificate-input";

const branding = sampleBranding({ template: "plain", brandColor: "#1D4F91" });
const { certificate } = sampleInput();

const input = signedCertificatePdfInput({
  numberPrefix: "RD-2026-",
  number: 42,
  signedAt: "2026-10-25T09:30:00.000Z",
  data: { ...certificate, branding },
});

describe("signedCertificatePdfInput", () => {
  it("renders with the branding frozen in the signed data", () => {
    expect(input.branding).toEqual(branding);
    expect(input.certificate).toEqual(certificate);
  });

  it("prints the full certificate number and the signing time", () => {
    expect(input.document).toEqual({
      number: "RD-2026-0042",
      signedAt: "2026-10-25T09:30:00.000Z",
    });
  });

  it("gives a valid PDF input", () => {
    expect(certificatePdfInput.safeParse(input).success).toBe(true);
  });
});
