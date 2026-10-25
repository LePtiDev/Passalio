import { describe, expect, it } from "vitest";
import type { DocumentSettings, OrganizationProfile } from "@/contexts/identity";
import { documentIssuerOf } from "./document-issuer";

const organization = (overrides: Partial<OrganizationProfile> = {}): OrganizationProfile => ({
  id: "organization-1",
  name: "Ramonage Dupont",
  siret: "12345678900012",
  address: "1 rue des Ramoneurs, 94100 Saint-Maur-des-Fossés",
  phone: "01 45 00 00 00",
  teamSize: "solo",
  trades: ["chimney_sweeping"],
  brandColor: "#1D4F91",
  documentNumberPrefix: "RD-",
  nextDocumentNumber: 1,
  hasLogo: false,
  isOnboardingCompleted: true,
  ...overrides,
});

const settings = (overrides: Partial<DocumentSettings> = {}): DocumentSettings => ({
  legalForm: "sarl",
  shareCapitalEuros: 5000,
  registryKind: "rcs",
  registryCity: "Créteil",
  apeCode: null,
  qualification: "Qualibois",
  documentTemplate: "plain",
  contactEmail: "contact@ramonage-dupont.fr",
  website: "  ",
  customerMessage: "Merci de votre confiance.",
  footerText: null,
  hasReservedNumbers: false,
  missingLegalMentions: [],
  ...overrides,
});

describe("documentIssuerOf", () => {
  it("freezes the legal identity of a complete company", () => {
    const issuer = documentIssuerOf({
      organization: organization(),
      settings: settings(),
      logo: null,
    });
    expect(issuer.company).toEqual({
      name: "Ramonage Dupont",
      legalForm: "sarl",
      shareCapitalEuros: 5000,
      siren: "123456789",
      registry: { kind: "rcs", city: "Créteil" },
      address: "1 rue des Ramoneurs, 94100 Saint-Maur-des-Fossés",
      phone: "01 45 00 00 00",
      qualification: "Qualibois",
    });
    expect(issuer.missingLegalMentions).toEqual([]);
  });

  it("copies the document settings, blank texts left out", () => {
    const logo = { format: "png" as const, base64: "iVBORw0KGgo=" };
    expect(
      documentIssuerOf({ organization: organization(), settings: settings(), logo }).branding,
    ).toEqual({
      template: "plain",
      brandColor: "#1D4F91",
      logo,
      contact: {
        phone: "01 45 00 00 00",
        email: "contact@ramonage-dupont.fr",
        website: null,
      },
      customerMessage: "Merci de votre confiance.",
      footerText: null,
    });
  });

  it("lists the missing legal mentions and gives no company", () => {
    const issuer = documentIssuerOf({
      organization: organization({ siret: null }),
      settings: settings({ legalForm: "sas", shareCapitalEuros: null, registryKind: null }),
      logo: null,
    });
    expect(issuer.company).toBeNull();
    expect(issuer.missingLegalMentions).toEqual(["siret", "shareCapitalEuros", "registry"]);
  });
});
