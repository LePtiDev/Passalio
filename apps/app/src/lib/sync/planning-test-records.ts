import type { DocumentRecord, InterventionRecord } from "../db/local-records";

const ORGANIZATION_ID = "organization-a";
const AT = "2026-10-22T10:00:00.000Z";

const synced = (id: string, deletedAt: string | null) => ({
  id,
  organizationId: ORGANIZATION_ID,
  createdAt: AT,
  updatedAt: deletedAt ?? AT,
  deletedAt,
});

export const serverInterventionRecord = (
  id: string,
  overrides: Partial<InterventionRecord> = {},
): InterventionRecord => ({
  ...synced(id, null),
  customerId: "customer-1",
  siteId: "site-1",
  technicianUserId: "user-1",
  scheduledDate: "2026-10-23",
  startTime: "09:00",
  durationMinutes: 60,
  equipmentIds: [],
  visitTypes: [],
  announcedPriceCents: null,
  notes: null,
  status: "planned",
  completedOn: null,
  paymentMethod: null,
  paidAmountCents: null,
  createdByUserId: "user-2",
  ...overrides,
});

export const serverDocumentRecord = (
  id: string,
  interventionId: string,
  equipmentId: string,
  deletedAt: string | null = null,
): DocumentRecord => ({
  ...synced(id, deletedAt),
  interventionId,
  equipmentId,
  kind: "chimney_sweeping_certificate",
  templateVersion: 1,
  number: 1,
  numberPrefix: "A",
  signedByUserId: "user-1",
  signedAt: AT,
  completedOn: "2026-10-22",
  cancelsDocumentId: null,
  data: {},
});
