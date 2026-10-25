import { describe, expect, it } from "vitest";
import { sampleBranding } from "./certificate-pdf-fixture";
import { previewCertificateInput } from "./certificate-preview";
import { certificateFonts, pdfText } from "./pdf-test-support";
import { renderCertificate } from "./render-certificate";

const FONTS = certificateFonts();

const previewText = async (preview: Parameters<typeof previewCertificateInput>[0]) => {
  const result = await renderCertificate(previewCertificateInput(preview), FONTS);
  expect(result.isOk).toBe(true);
  return result.isOk ? pdfText(result.value) : "";
};

describe("previewCertificateInput", () => {
  it("shows the company, its numbering and its look on the sample certificate", async () => {
    const text = await previewText({
      company: {
        name: "Fumisterie Martin",
        legalForm: "ei",
        shareCapitalEuros: null,
        siren: "823456789",
        registry: { kind: "rne" },
        address: "3 place du Marché, 94300 Vincennes",
        qualification: "Qualibois 2026",
      },
      branding: sampleBranding({ template: "plain", footerText: "Assurance : Axa Pro." }),
      number: "FM-0007",
    });
    expect(text).toContain("Fumisterie Martin EI");
    expect(text).toContain("SIREN 823 456 789 RNE");
    expect(text).toContain("N° FM-0007");
    expect(text).toContain("Qualibois 2026");
    expect(text).toContain("Assurance : Axa Pro.");
  });

  it("keeps the sample legal details the company has not filled in yet", async () => {
    const text = await previewText({
      company: { name: "Ramonage Neuf" },
      branding: sampleBranding(),
      number: "0001",
    });
    expect(text).toContain("Ramonage Neuf SAS au capital de 5 000 €");
    expect(text).toContain("RCS Créteil");
  });
});
