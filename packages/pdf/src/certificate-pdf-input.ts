import type { BrandColor } from "@passalio/shared";
import { chimneySweepingCertificate, documentBranding } from "@passalio/trades";
import * as z from "zod";

export { DOCUMENT_TEMPLATES, type DocumentTemplate } from "@passalio/shared";
export {
  BRANDING_TEXT_MAX_LENGTH,
  documentBranding,
  LOGO_FORMATS,
  type DocumentBranding,
} from "@passalio/trades";

export const certificatePdfInput = z.strictObject({
  certificate: chimneySweepingCertificate,
  branding: documentBranding,
  document: z.strictObject({
    number: z.string().trim().min(1).max(40),
    signedAt: z.iso.datetime(),
  }),
});

export type CertificatePdfInput = z.infer<typeof certificatePdfInput>;

export const SOFT_BRAND_COLORS: Readonly<Record<BrandColor, string>> = {
  "#0F2A44": "#EEF3F8",
  "#0E7C5A": "#E6F4EE",
  "#B42318": "#FDEDEC",
  "#1D4F91": "#EAF1FB",
  "#334155": "#F1F4F8",
};
