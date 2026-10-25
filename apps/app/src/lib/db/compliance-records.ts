import { chimneySweepingCertificate, documentBranding, LEGAL_MENTIONS } from "@passalio/trades";
import * as z from "zod";

export const numberBlockRecord = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),
  numberPrefix: z.string(),
  firstNumber: z.int(),
  lastNumber: z.int(),
});

export const documentIssuer = z.object({
  company: chimneySweepingCertificate.shape.company.nullable(),
  missingLegalMentions: z.array(z.enum(LEGAL_MENTIONS)),
  branding: documentBranding,
});

export const localSetting = z.discriminatedUnion("key", [
  z.object({ key: z.literal("device"), deviceId: z.string() }),
  z.object({ key: z.literal("signer"), userId: z.string(), name: z.string() }),
  z.object({ key: z.literal("signature"), userId: z.string(), image: z.string() }),
  z.object({ key: z.literal("issuer"), issuer: documentIssuer, savedAt: z.string() }),
]);

export type NumberBlockRecord = z.infer<typeof numberBlockRecord>;
export type DocumentIssuer = z.infer<typeof documentIssuer>;
export type LocalSetting = z.infer<typeof localSetting>;

export type CertificateDraftRecord = {
  readonly id: string;
  readonly interventionId: string;
  readonly equipmentId: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly updatedAt: string;
};
