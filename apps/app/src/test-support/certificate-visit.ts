import type { DocumentIssuer } from "@/lib/db/compliance-records";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { DocumentRecord, EquipmentRecord, InterventionRecord } from "@/lib/db/local-records";
import { serverInterventionRecord } from "@/lib/sync/planning-test-records";
import { serverCustomerRecord, serverSiteRecord } from "@/lib/sync/sync-test-records";
import { certificateBody, insertEquipment, numberBlock, sampleIssuer } from "./certificate-records";

export const VISIT_ID = "visit-1";

export const INSERT_ID = "equipment-insert";

export const STOVE_ID = "equipment-stove";

export const BOILER_ID = "equipment-boiler";

export const VISIT_DAY = "2026-10-23";

type VisitSeed = {
  readonly equipments?: readonly EquipmentRecord[];
  readonly intervention?: Partial<InterventionRecord>;
  readonly issuer?: DocumentIssuer | null;
};

export const stoveEquipment = () =>
  insertEquipment(STOVE_ID, { kind: "log_stove", brand: "Godin", room: "Cuisine" });

export const sealedBoiler = () =>
  insertEquipment(BOILER_ID, {
    kind: "boiler",
    energy: "gas",
    details: { flueType: "sealed_concentric" },
  });

export const seedCertificateVisit = async (database: LocalDatabase, seed: VisitSeed = {}) => {
  const equipments = seed.equipments ?? [
    insertEquipment(INSERT_ID, { brand: "Invicta", room: "Séjour" }),
  ];
  await database.customers.put({
    ...serverCustomerRecord("customer-1", "Garnier"),
    firstName: "Hélène",
  });
  await database.sites.put({
    ...serverSiteRecord("site-1", "customer-1"),
    address: "9 rue de la Mare",
    postalCode: "94170",
    city: "Le Perreux-sur-Marne",
  });
  await database.equipments.bulkPut([...equipments]);
  await database.interventions.put(
    serverInterventionRecord(VISIT_ID, {
      scheduledDate: VISIT_DAY,
      startTime: "10:00",
      equipmentIds: equipments.map(({ id }) => id),
      ...seed.intervention,
    }),
  );
  await database.members.put({ userId: "user-1", name: "Jean Dupont", role: "owner" });
  await database.numberBlocks.put(numberBlock());
  const issuer = seed.issuer === undefined ? sampleIssuer() : seed.issuer;
  if (issuer !== null) {
    await database.localSettings.put({
      key: "issuer",
      issuer,
      savedAt: "2026-10-22T08:00:00.000Z",
    });
  }
};

export const signedCertificateDocument = (
  overrides: Partial<DocumentRecord> = {},
): DocumentRecord => ({
  id: "document-1",
  organizationId: "organization-a",
  createdAt: "2026-10-23T08:42:00.000Z",
  updatedAt: "2026-10-23T08:42:00.000Z",
  deletedAt: null,
  interventionId: VISIT_ID,
  equipmentId: INSERT_ID,
  kind: "chimney_sweeping_certificate",
  templateVersion: 2,
  number: 144,
  numberPrefix: "RD-2026-",
  signedByUserId: "user-1",
  signedAt: "2026-10-23T08:42:00.000Z",
  completedOn: VISIT_DAY,
  cancelsDocumentId: null,
  data: {
    ...certificateBody(),
    company: sampleIssuer().company,
    branding: sampleIssuer().branding,
  },
  ...overrides,
});
