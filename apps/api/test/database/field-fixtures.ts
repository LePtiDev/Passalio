import { newId } from "@passalio/shared";
import { CERTIFICATE_TEMPLATE_VERSION } from "@passalio/trades";
import { validCertificateData } from "../../src/contexts/compliance/application/certificate-data.fixture";
import type { SignedDocument } from "../../src/contexts/compliance/domain/document-models";
import type { Intervention } from "../../src/contexts/scheduling/domain/intervention-models";
import { AT, LATER } from "./domain-fixtures";

export const DEVICE_ID = "0192f3a4-5b6c-7d8e-9f01-0000000000d1";

export const anIntervention = (
  organizationId: string,
  place: { readonly customerId: string; readonly siteId: string; readonly equipmentId: string },
  technicianUserId: string,
): Intervention => ({
  id: newId(),
  organizationId,
  customerId: place.customerId,
  siteId: place.siteId,
  technicianUserId,
  scheduledDate: "2026-10-22",
  startTime: "09:00",
  durationMinutes: 60,
  equipmentIds: [place.equipmentId],
  announcedPriceCents: 8000,
  notes: "Sonner chez la voisine",
  status: "completed",
  completedOn: "2026-10-22",
  paymentMethod: "check",
  paidAmountCents: 8000,
  createdByUserId: technicianUserId,
  createdAt: AT,
  updatedAt: LATER,
});

export const aSignedDocument = (
  intervention: Intervention,
  equipmentId: string,
  numbering: { readonly number: number; readonly numberPrefix: string },
): SignedDocument => ({
  id: newId(),
  organizationId: intervention.organizationId,
  interventionId: intervention.id,
  equipmentId,
  trade: "chimney_sweeping",
  kind: "chimney_sweeping_certificate",
  templateVersion: CERTIFICATE_TEMPLATE_VERSION,
  number: numbering.number,
  numberPrefix: numbering.numberPrefix,
  deviceId: DEVICE_ID,
  signedByUserId: intervention.technicianUserId,
  signedAt: LATER,
  completedOn: "2026-10-22",
  cancelsDocumentId: null,
  data: validCertificateData({ completedOn: "2026-10-22", visitedOn: "2026-10-22" }),
  createdAt: LATER,
  updatedAt: LATER,
});

export const sweepingOf = (equipmentId: string) => ({
  equipmentId,
  lastSweepingOn: "2026-10-22",
  nextDueDate: "2027-10-22",
  updatedAt: LATER,
});
