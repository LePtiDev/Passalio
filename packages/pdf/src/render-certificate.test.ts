import { describe, expect, it } from "vitest";
import { CUSTOMER_SIGNATURE, sampleInput } from "./certificate-pdf-fixture";
import { pdfFingerprint } from "./pdf-fingerprint";
import { certificateFonts, pdfMetadata, pdfPageTexts, pdfText } from "./pdf-test-support";
import { renderCertificate } from "./render-certificate";

type Overrides = Parameters<typeof sampleInput>[0];

const FONTS = certificateFonts();

const render = async (input: unknown) => {
  const result = await renderCertificate(input, FONTS);
  if (!result.isOk) {
    throw new Error(result.error);
  }
  return result.value;
};

const textOf = async (overrides: Overrides = {}) => pdfText(await render(sampleInput(overrides)));

describe("renderCertificate, mandatory mentions read back from the PDF", () => {
  const MENTIONS: readonly (readonly [string, string])[] = [
    [
      "the R. 1331-75 legal basis",
      "Attestation de ramonage établie en application de l'article R. 1331-75 du code de la santé publique.",
    ],
    ["the document title and number", "Certificat de ramonage N° RD-2026-0142"],
    ["the flue swept (R. 1331-75)", "Conduit maçonné, du séjour à la toiture"],
    [
      "the emptiness over the whole length (R. 1331-75)",
      "Vacuité du conduit attestée sur toute sa longueur, tuyau de raccordement compris.",
    ],
    [
      "the mechanical method (R. 1331-70)",
      "Ramonage par action mécanique directe sur la paroi intérieure du conduit.",
    ],
    [
      "the chimney stack check (R. 1331-70)",
      "Souche et accessoires (mitre, aspirateur) vérifiés : en bon état.",
    ],
    ["the visit date", "VISITE 23 octobre 2026"],
    ["the completion date", "OPÉRATION ACHEVÉE LE 23 octobre 2026"],
    ["the recommended next sweeping", "PROCHAIN RAMONAGE CONSEILLÉ AVANT LE 23 octobre 2027"],
    ["the customer", "Hélène Garnier"],
    [
      "the installation address and room",
      "Maison · séjour, rez-de-chaussée 9 rue de la Mare 94170 Le Perreux-sur-Marne",
    ],
    ["the appliance", "Insert"],
    ["the brand and model", "Invicta 700"],
    ["the serial number", "IV7-2016-0388"],
    ["the last sweeping date", "19 septembre 2025"],
    ["the qualified technician", "Ramonage effectué par Jean Dupont · Qualibat 5131"],
    ["the signing time", "Signé le 23/10/2026 à 11:44"],
    [
      "the company identity (R. 123-237, R. 123-238)",
      "Ramonage Dupont SAS au capital de 5 000 € · SIREN 912 345 678 RCS Créteil · siège : 12 rue des Tilleuls, 94100 Saint-Maur-des-Fossés",
    ],
    [
      "the advice legal basis (R. 1331-77, annexe 2)",
      "Conseils remis en application de l'article R. 1331-77 du code de la santé publique et de l'annexe 2 de l'arrêté du 20 juillet 2023",
    ],
    [
      "the advice disclaimer (annexe 2)",
      "Ces conseils sont donnés à titre indicatif. Ce ne sont pas des obligations : aucun investissement évoqué n'est imposé.",
    ],
    ["the two years keeping rule (R. 1331-75)", "Conservez ce certificat au moins deux ans"],
    [
      "the company footer text",
      "Assurance responsabilité civile professionnelle : MAAF Pro, contrat n° 4521 889 J.",
    ],
    ["the company message", "Nous vous rappellerons avant le prochain ramonage."],
    ["the page numbers", "Page 1 sur 2"],
  ];

  it.each(MENTIONS)("prints %s", async (_, mention) => {
    expect(await textOf()).toContain(mention);
  });

  it("puts the advice on the second page", async () => {
    const pages = await pdfPageTexts(await render(sampleInput()));
    expect(pages).toHaveLength(2);
    expect(pages[1]).toContain("Nos conseils pour votre appareil");
    expect(pages[1]).toContain("Page 2 sur 2");
  });
});

describe("renderCertificate, variants", () => {
  it("never prints the full length attestation after a partial sweeping", async () => {
    const text = await textOf({
      certificate: {
        sweepingExtent: "partial",
        unsweptPart: "les 2 derniers mètres, sous la souche.",
        isDoNotUse: true,
      },
    });
    expect(text).not.toContain("attestée sur toute sa longueur");
    expect(text).toContain(
      "Vacuité non attestée sur toute la longueur. Partie non ramonée : les 2 derniers mètres, sous la souche.",
    );
    expect(text).toContain("Ramonage partiel");
    expect(text).toContain("UTILISATION DU CONDUIT DÉCONSEILLÉE");
    expect(text).toContain("PROCHAIN RAMONAGE CONSEILLÉ AVANT LE Après remise en état");
  });

  it("prints the customer as absent", async () => {
    const text = await textOf({ certificate: { customerSignature: null, isCustomerAbsent: true } });
    expect(text).toContain("Client absent lors du passage");
    expect(text).toContain("Certificat remis sans signature du client.");
  });

  it("prints a single page with the company message when no advice is due", async () => {
    const equipment = {
      kind: "boiler" as const,
      energy: "oil" as const,
      brand: null,
      model: null,
      serialNumber: null,
      flueType: "masonry" as const,
    };
    const bytes = await render(
      sampleInput({ certificate: { equipment, isAdviceAttached: false } }),
    );
    const pages = await pdfPageTexts(bytes);
    expect(pages).toHaveLength(1);
    expect(pages[0]).not.toContain("Nos conseils");
    expect(pages[0]).toContain("Nous vous rappellerons avant le prochain ramonage.");
    expect(pages[0]).toContain("Page 1 sur 1");
  });

  it("prints the plain template with the same mentions", async () => {
    const text = await textOf({ branding: { template: "plain", brandColor: "#0E7C5A" } });
    expect(text).toContain("Vacuité du conduit attestée sur toute sa longueur");
    expect(text).toContain("SIREN 912 345 678 RCS Créteil");
  });

  it("shows only the contact details the company chose", async () => {
    const text = await textOf({
      branding: { contact: { phone: null, email: null, website: "ramonage-dupont.fr" } },
    });
    expect(text).toContain("ramonage-dupont.fr");
    expect(text).not.toContain("contact@ramonage-dupont.fr");
  });

  it("moves to a further page when the observations are very long, keeping every word", async () => {
    const anomalies = Array.from(
      { length: 40 },
      (_, index) => `Constat numéro ${index + 1} sur le conduit.`,
    ).join(" ");
    const flues = Array.from({ length: 10 }, (_, index) => ({
      designation: `Conduit ${index + 1}`,
    }));
    const bytes = await render(sampleInput({ certificate: { anomalies, flues } }));
    const { pageCount } = await pdfMetadata(bytes);
    const text = await pdfText(bytes);
    expect(pageCount).toBe(3);
    expect(text).toContain("Constat numéro 40 sur le conduit.");
    expect(text).toContain("Conduit 10");
    expect(text).toContain("Page 3 sur 3");
  });

  it("embeds a company logo", async () => {
    const logo = {
      format: "png" as const,
      base64: CUSTOMER_SIGNATURE.replace("data:image/png;base64,", ""),
    };
    const withLogo = await render(sampleInput({ branding: { logo } }));
    const withoutLogo = await render(sampleInput());
    expect(withLogo.length).toBeGreaterThan(withoutLogo.length);
  });

  it("refuses an unreadable logo", async () => {
    const result = await renderCertificate(
      sampleInput({ branding: { logo: { format: "png", base64: "AAAA" } } }),
      FONTS,
    );
    expect(result).toEqual({ isOk: false, error: "unreadable_image" });
  });

  it("refuses an unreadable signature", async () => {
    const result = await renderCertificate(
      sampleInput({ certificate: { technicianSignature: "data:image/png;base64,AAAA" } }),
      FONTS,
    );
    expect(result).toEqual({ isOk: false, error: "unreadable_image" });
  });

  it("refuses an invalid certificate without drawing anything", async () => {
    const result = await renderCertificate(
      sampleInput({ certificate: { isAdviceAttached: false } }),
      FONTS,
    );
    expect(result).toEqual({ isOk: false, error: "advice_required" });
  });
});

describe("renderCertificate, integrity", () => {
  it("produces the very same bytes for the same certificate", async () => {
    const first = await render(sampleInput());
    const second = await render(sampleInput());
    expect(await pdfFingerprint(first)).toBe(await pdfFingerprint(second));
  });

  it("produces another fingerprint when one word changes", async () => {
    const original = await render(sampleInput());
    const changed = await render(sampleInput({ certificate: { anomalies: "Autre constat." } }));
    expect(await pdfFingerprint(changed)).not.toBe(await pdfFingerprint(original));
  });

  it("dates the file at the signing time and describes it", async () => {
    const { info } = await pdfMetadata(await render(sampleInput()));
    expect(info).toMatchObject({
      Title: "Certificat de ramonage N° RD-2026-0142",
      Author: "Ramonage Dupont",
      Creator: "Passalio",
      Producer: "Passalio",
      Language: "fr-FR",
      CreationDate: "D:20261023094400Z",
    });
  });
});
