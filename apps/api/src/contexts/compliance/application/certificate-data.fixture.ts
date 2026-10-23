import type { ChimneySweepingCertificate } from "@passalio/trades";

const SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";

export const validCertificateData = (
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

export const sealedBoilerCertificateData = (
  overrides: Partial<ChimneySweepingCertificate> = {},
): ChimneySweepingCertificate =>
  validCertificateData({
    equipment: {
      kind: "boiler",
      energy: "gas",
      brand: null,
      model: null,
      serialNumber: null,
      flueType: "sealed_concentric",
    },
    sweepingExtent: "sealed_appliance",
    isAdviceAttached: false,
    ...overrides,
  });
