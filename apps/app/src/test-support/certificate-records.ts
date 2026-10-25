import type { CertificateCompany } from "@passalio/trades";
import type { DocumentIssuer, NumberBlockRecord } from "@/lib/db/compliance-records";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { serverEquipmentRecord } from "@/lib/sync/sync-test-records";
import type { CertificateBody } from "@/contexts/compliance";

export const SIGNATURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const SAMPLE_COMPANY: CertificateCompany = {
  name: "Ramonage Dupont",
  legalForm: "sarl",
  shareCapitalEuros: 5000,
  siren: "123456789",
  registry: { kind: "rcs", city: "Créteil" },
  address: "1 rue des Ramoneurs, 94100 Saint-Maur-des-Fossés",
  phone: "01 45 00 00 00",
  qualification: null,
};

export const sampleIssuer = (overrides: Partial<DocumentIssuer> = {}): DocumentIssuer => ({
  company: SAMPLE_COMPANY,
  missingLegalMentions: [],
  branding: {
    template: "plain",
    brandColor: "#0E7C5A",
    logo: null,
    contact: { phone: "01 45 00 00 00", email: null, website: null },
    customerMessage: null,
    footerText: null,
  },
  ...overrides,
});

export const insertEquipment = (id: string, overrides: Partial<EquipmentRecord> = {}) => ({
  ...serverEquipmentRecord(id, "site-1"),
  kind: "insert" as const,
  energy: "wood_logs" as const,
  details: { flueType: "lined_masonry" },
  ...overrides,
});

export const certificateBody = (overrides: Partial<CertificateBody> = {}): CertificateBody => ({
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

export const numberBlock = (overrides: Partial<NumberBlockRecord> = {}): NumberBlockRecord => ({
  id: "block-1",
  userId: "user-1",
  deviceId: "0190f3a0-0000-7000-8000-00000000d001",
  numberPrefix: "RD-",
  firstNumber: 1,
  lastNumber: 20,
  ...overrides,
});
