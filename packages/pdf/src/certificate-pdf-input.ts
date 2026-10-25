import { BRAND_COLORS, type BrandColor } from "@passalio/shared";
import { chimneySweepingCertificate } from "@passalio/trades";
import * as z from "zod";

export const DOCUMENT_TEMPLATES = ["banner", "plain"] as const;

export type DocumentTemplate = (typeof DOCUMENT_TEMPLATES)[number];

export const LOGO_FORMATS = ["png", "jpeg"] as const;

export const BRANDING_TEXT_MAX_LENGTH = 300;

const LOGO_MAX_BASE64_LENGTH = 3_000_000;
const CONTACT_MAX_LENGTH = 120;

const optionalText = (maxLength: number) => z.string().trim().min(1).max(maxLength).nullable();

export const documentBranding = z.strictObject({
  template: z.enum(DOCUMENT_TEMPLATES),
  brandColor: z.enum(BRAND_COLORS),
  logo: z
    .strictObject({
      format: z.enum(LOGO_FORMATS),
      base64: z
        .string()
        .max(LOGO_MAX_BASE64_LENGTH)
        .regex(/^[A-Za-z0-9+/=]+$/),
    })
    .nullable(),
  contact: z.strictObject({
    phone: optionalText(CONTACT_MAX_LENGTH),
    email: optionalText(CONTACT_MAX_LENGTH),
    website: optionalText(CONTACT_MAX_LENGTH),
  }),
  customerMessage: optionalText(BRANDING_TEXT_MAX_LENGTH),
  footerText: optionalText(BRANDING_TEXT_MAX_LENGTH),
});

export type DocumentBranding = z.infer<typeof documentBranding>;

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
