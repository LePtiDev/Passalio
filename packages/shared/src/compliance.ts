import * as z from "zod";

export const DOCUMENT_KINDS = ["chimney_sweeping_certificate"] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_NUMBER_BLOCK_SIZE = 20;

export const DOCUMENT_NUMBER_REFILL_THRESHOLD = 5;

export const MAX_DOCUMENT_NUMBER = 99_999_999;

export const complianceMutation = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sign_document"),
    documentId: z.uuid(),
    interventionId: z.uuid(),
    equipmentId: z.uuid(),
    deviceId: z.uuid(),
    kind: z.enum(DOCUMENT_KINDS),
    templateVersion: z.int().min(1),
    number: z.int().min(1).max(MAX_DOCUMENT_NUMBER),
    signedAt: z.iso.datetime(),
    cancelsDocumentId: z.uuid().optional(),
    data: z.record(z.string(), z.unknown()),
  }),
]);

export type ComplianceMutation = z.infer<typeof complianceMutation>;

export const reserveNumberBlockBody = z.object({ deviceId: z.uuid() });

export type ReserveNumberBlockBody = z.infer<typeof reserveNumberBlockBody>;

export const numberBlockResponse = z.object({
  id: z.string(),
  deviceId: z.string(),
  numberPrefix: z.string(),
  firstNumber: z.int(),
  lastNumber: z.int(),
});

export type NumberBlockResponse = z.infer<typeof numberBlockResponse>;

export const DOCUMENT_NUMBER_WIDTH = 4;

export const documentNumberLabel = (prefix: string, number: number) =>
  `${prefix}${String(number).padStart(DOCUMENT_NUMBER_WIDTH, "0")}`;
