import {
  DOCUMENT_KINDS,
  INTERVENTION_STATUSES,
  ORGANIZATION_ROLES,
  PAYMENT_METHODS,
} from "@passalio/shared";
import { SERVICE_DOCUMENTS, TRADE_IDS } from "@passalio/trades";
import * as z from "zod";
import { nullableText, synced } from "./local-records";

export const interventionRecord = z.object({
  ...synced,
  customerId: z.string(),
  siteId: z.string(),
  technicianUserId: z.string(),
  technicianUserIds: z.array(z.string()).default([]),
  scheduledDate: z.string(),
  startTime: nullableText,
  durationMinutes: z.number(),
  equipmentIds: z.array(z.string()),
  visitTypes: z.array(z.enum(TRADE_IDS)).default([]),
  serviceLines: z
    .array(
      z.object({
        serviceId: z.string(),
        name: z.string(),
        durationMinutes: z.number(),
        priceCents: z.number().nullable(),
      }),
    )
    .default([]),
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
  pdfSha256: nullableText.optional(),
});

export const memberRecord = z.object({
  userId: z.string(),
  name: z.string(),
  role: z.enum(ORGANIZATION_ROLES),
});

export const serviceRecord = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  priceCents: z.number().nullable(),
  document: z.enum(SERVICE_DOCUMENTS),
  trade: z.enum(TRADE_IDS).nullable(),
});

export type InterventionRecord = z.infer<typeof interventionRecord>;
export type DocumentRecord = z.infer<typeof documentRecord>;
export type MemberRecord = z.infer<typeof memberRecord>;
export type ServiceRecord = z.infer<typeof serviceRecord>;
