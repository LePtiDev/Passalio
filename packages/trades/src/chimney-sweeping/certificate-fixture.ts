import type { DocumentBranding } from "../document-branding";
import type { BrandedChimneySweepingCertificate, ChimneySweepingCertificate } from "./certificate";

const SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";

export const validCertificate = (
  overrides: Partial<ChimneySweepingCertificate> = {},
): ChimneySweepingCertificate => ({
  company: {
    name: "Ramonage Dupont",
    legalForm: "sarl",
    shareCapitalEuros: 5000,
    siren: "123456789",
    registry: { kind: "rcs", city: "Créteil" },
    address: "1 rue des Ramoneurs, 94100 Saint-Maur-des-Fossés",
    phone: null,
    qualification: null,
  },
  customer: { name: "Hélène Garnier", address: "9 rue de la Mare, 94170 Le Perreux-sur-Marne" },
  site: { address: "9 rue de la Mare, 94170 Le Perreux-sur-Marne", room: "Salon" },
  equipment: {
    kind: "insert",
    energy: "wood_logs",
    brand: "Invicta",
    model: null,
    serialNumber: null,
    flueType: "lined_masonry",
  },
  technician: { name: "Jean Dupont" },
  flues: [{ designation: "Conduit du salon" }],
  sweepingExtent: "full_length",
  unsweptPart: null,
  isConnectionPipeSwept: true,
  chimneyStacks: "good",
  anomalies: null,
  isDoNotUse: false,
  visitedOn: "2026-10-23",
  completedOn: "2026-10-23",
  lastSweepingOn: null,
  lastServiceOn: null,
  isAdviceAttached: true,
  technicianSignature: SIGNATURE,
  customerSignature: SIGNATURE,
  isCustomerAbsent: false,
  ...overrides,
});

export const sampleBranding = (overrides: Partial<DocumentBranding> = {}): DocumentBranding => ({
  template: "banner",
  brandColor: "#0F2A44",
  logo: null,
  contact: { phone: "01 45 00 00 00", email: "contact@ramonage-dupont.fr", website: null },
  customerMessage: null,
  footerText: null,
  ...overrides,
});

export const validBrandedCertificate = (
  overrides: Partial<BrandedChimneySweepingCertificate> = {},
): BrandedChimneySweepingCertificate => ({
  ...validCertificate(),
  branding: sampleBranding(),
  ...overrides,
});
