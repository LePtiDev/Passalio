import { describe, expect, it } from "vitest";
import { certificateContent, type CertificateContent } from "./certificate-content";
import { sampleInput } from "./certificate-pdf-fixture";

type Overrides = Parameters<typeof sampleInput>[0];

const errorOf = (overrides: Overrides) => {
  const result = certificateContent(sampleInput(overrides));
  return result.isOk ? "ok" : result.error;
};

const contentOf = (overrides: Overrides = {}): CertificateContent => {
  const result = certificateContent(sampleInput(overrides));
  if (!result.isOk) {
    throw new Error(result.error);
  }
  return result.value.content;
};

const checkTexts = (content: CertificateContent) =>
  content.checks.map((check) => check.runs.map((run) => run.text).join(""));

describe("certificateContent, refusals", () => {
  it("accepts the sample certificate", () => {
    expect(errorOf({})).toBe("ok");
  });

  it("refuses data that is not a certificate", () => {
    expect(certificateContent({ certificate: {} }).isOk).toBe(false);
    const input = sampleInput();
    const unknownColor = { ...input, branding: { ...input.branding, brandColor: "#123456" } };
    expect(certificateContent(unknownColor)).toEqual({ isOk: false, error: "invalid_pdf_input" });
  });

  it("refuses a certificate without any flue (R. 1331-75)", () => {
    expect(errorOf({ certificate: { flues: [] } })).toBe("invalid_pdf_input");
  });

  it("refuses a partial sweeping without the unswept part", () => {
    expect(errorOf({ certificate: { sweepingExtent: "partial", unsweptPart: null } })).toBe(
      "unswept_part_required",
    );
  });

  it("refuses a company with a share capital form but no capital (R. 123-238)", () => {
    const company = {
      ...sampleInput().certificate.company,
      legalForm: "sarl" as const,
      shareCapitalEuros: null,
    };
    expect(errorOf({ certificate: { company } })).toBe("share_capital_required");
  });

  it("refuses a solid fuel sweeping without the advice (R. 1331-77)", () => {
    expect(errorOf({ certificate: { isAdviceAttached: false } })).toBe("advice_required");
  });

  it("refuses a certificate the customer neither signed nor was marked absent for", () => {
    expect(errorOf({ certificate: { customerSignature: null, isCustomerAbsent: false } })).toBe(
      "customer_signature_required",
    );
  });

  it("refuses a completion date before the visit", () => {
    expect(errorOf({ certificate: { visitedOn: "2026-10-24", completedOn: "2026-10-23" } })).toBe(
      "completed_before_visit",
    );
  });

  it("refuses to certify a sealed gas appliance until a trade validation", () => {
    const equipment = {
      kind: "boiler" as const,
      energy: "gas" as const,
      brand: null,
      model: null,
      serialNumber: null,
      flueType: "sealed_concentric" as const,
    };
    expect(
      errorOf({
        certificate: { equipment, sweepingExtent: "sealed_appliance", isAdviceAttached: false },
      }),
    ).toBe("sealed_appliance_not_supported");
  });

  it("refuses a malformed signing time", () => {
    expect(
      certificateContent({ ...sampleInput(), document: { number: "A-1", signedAt: "hier" } }).isOk,
    ).toBe(false);
  });
});

describe("certificateContent, mentions", () => {
  it("attests the emptiness over the whole length, connection pipe included, after a full sweeping", () => {
    const [mechanical, vacuity] = checkTexts(contentOf());
    expect(mechanical).toBe(
      "Ramonage par action mécanique directe sur la paroi intérieure du conduit.",
    );
    expect(vacuity).toBe(
      "Vacuité du conduit attestée sur toute sa longueur, tuyau de raccordement compris.",
    );
  });

  it("says when the connection pipe was not swept", () => {
    expect(checkTexts(contentOf({ certificate: { isConnectionPipeSwept: false } }))[1]).toBe(
      "Vacuité du conduit attestée sur toute sa longueur. Tuyau de raccordement non ramoné.",
    );
  });

  it("never attests the emptiness over the whole length after a partial sweeping", () => {
    const content = contentOf({
      certificate: { sweepingExtent: "partial", unsweptPart: "les 2 derniers mètres" },
    });
    expect(checkTexts(content).join(" ")).not.toContain("attestée sur toute sa longueur");
    expect(checkTexts(content)[1]).toBe(
      "Vacuité non attestée sur toute la longueur. Partie non ramonée : les 2 derniers mètres",
    );
    expect(content.checks[1]?.isMet).toBe(false);
    expect(content.flues[0]).toMatchObject({ result: "Ramonage partiel", isComplete: false });
  });

  it.each([
    ["good", "Souche et accessoires (mitre, aspirateur) vérifiés : en bon état.", true],
    ["needs_repair", "Souche et accessoires vérifiés : remise en état nécessaire.", false],
    ["not_checked", "Souche et accessoires : non vérifiés, accès impossible.", false],
  ] as const)("reports the chimney stack state %s (R. 1331-70)", (chimneyStacks, text, isMet) => {
    const content = contentOf({ certificate: { chimneyStacks } });
    expect(checkTexts(content)[2]).toBe(text);
    expect(content.checks[2]?.isMet).toBe(isMet);
  });

  it("recommends the next sweeping twelve months after completion", () => {
    expect(contentOf().dates.map((date) => date.value)).toEqual([
      "23 octobre 2026",
      "23 octobre 2026",
      "23 octobre 2027",
    ]);
  });

  it("recommends no date but a repair when the flue should not be used", () => {
    const content = contentOf({ certificate: { isDoNotUse: true } });
    expect(content.dates[2].value).toBe("Après remise en état");
    expect(content.doNotUse?.title).toBe("Utilisation du conduit déconseillée");
    expect(content.doNotUse?.body).toMatch(/^Nous vous recommandons/);
  });

  it("lists every flue swept", () => {
    const flues = [{ designation: "Conduit du salon" }, { designation: "Conduit de la cuisine" }];
    expect(contentOf({ certificate: { flues } }).flues.map((flue) => flue.designation)).toEqual([
      "Conduit du salon",
      "Conduit de la cuisine",
    ]);
  });

  it("writes unknown equipment details as not known", () => {
    const equipment = {
      ...sampleInput().certificate.equipment,
      energy: null,
      brand: null,
      model: null,
      serialNumber: null,
      flueType: null,
    };
    const values = contentOf({ certificate: { equipment, lastSweepingOn: null } }).equipment.map(
      (field) => field.value,
    );
    expect(values).toEqual([
      "Insert",
      "Non connu",
      "Non connu",
      "Non connu",
      "Non connu",
      "Non connu",
      "Non connu",
    ]);
  });

  it("names the technician with the qualification and the signing time in Paris", () => {
    const { technician } = contentOf();
    expect(technician.label).toBe("Jean Dupont · Qualibat 5131");
    expect(technician.note).toBe("Signé le 23/10/2026 à 11:44");
  });

  it("marks the customer as absent instead of a signature", () => {
    const content = contentOf({ certificate: { customerSignature: null, isCustomerAbsent: true } });
    expect(content.customerSignature).toEqual({
      isAbsent: true,
      note: "Certificat remis sans signature du client.",
    });
  });

  it("uses the room as the installation label, or a default label", () => {
    expect(contentOf().site.label).toBe("Maison · séjour, rez-de-chaussée");
    const site = { address: "1 rue A", room: null };
    expect(contentOf({ certificate: { site } }).site.label).toBe("Lieu de l'installation");
  });

  it("keeps the observations written by the technician", () => {
    expect(contentOf({ certificate: { anomalies: "Mitre cassée." } }).observations).toBe(
      "Mitre cassée.",
    );
    expect(contentOf({ certificate: { anomalies: null } }).observations).toBeNull();
  });
});
