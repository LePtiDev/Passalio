import {
  DOCUMENT_KINDS,
  INTERVENTION_STATUSES,
  ORGANIZATION_ROLES,
  PAYMENT_METHODS,
} from "@passalio/shared";
import * as z from "zod";
import { nullableText, synced } from "./local-records";

export const interventionRecord = z.object({
  ...synced,
  customerId: z.string(),
  siteId: z.string(),
  technicianUserId: z.string(),
  scheduledDate: z.string(),
  startTime: nullableText,
  durationMinutes: z.number(),
  equipmentIds: z.array(z.string()),
  announcedPriceCents: z.number().nullable(),
  notes: nullableText,
  status: z.enum(INTERVENTION_STATUSES),
  completedOn: nullableText,
  paymentMethod: z.enum(PAYMENT_METHODS).nullable(),
  paidAmountCents: z.number().nullable(),
  createdByUserId: z.string(),
});

export const documentRecord = z.object({
  ...synced,
  interventionId: z.string(),
  equipmentId: z.string(),
  kind: z.enum(DOCUMENT_KINDS),
  templateVersion: z.number(),
  number: z.number(),
  numberPrefix: z.string(),
  signedByUserId: z.string(),
  signedAt: z.string(),
  completedOn: z.string(),
  cancelsDocumentId: nullableText,
  data: z.record(z.string(), z.unknown()),
});

export const memberRecord = z.object({
  userId: z.string(),
  name: z.string(),
  role: z.enum(ORGANIZATION_ROLES),
});

export type InterventionRecord = z.infer<typeof interventionRecord>;
export type DocumentRecord = z.infer<typeof documentRecord>;
export type MemberRecord = z.infer<typeof memberRecord>;
