import {
  BRAND_COLORS,
  CONTACT_TEXT_MAX_LENGTH,
  DOCUMENT_TEMPLATES,
  DOCUMENT_TEXT_MAX_LENGTH,
} from "@passalio/shared";
import * as z from "zod";

export const LOGO_FORMATS = ["png", "jpeg"] as const;

export type LogoFormat = (typeof LOGO_FORMATS)[number];

export const BRANDING_TEXT_MAX_LENGTH = DOCUMENT_TEXT_MAX_LENGTH;

export const LOGO_MAX_BASE64_LENGTH = 1_000_000;

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
    phone: optionalText(CONTACT_TEXT_MAX_LENGTH),
    email: optionalText(CONTACT_TEXT_MAX_LENGTH),
    website: optionalText(CONTACT_TEXT_MAX_LENGTH),
  }),
  customerMessage: optionalText(BRANDING_TEXT_MAX_LENGTH),
  footerText: optionalText(BRANDING_TEXT_MAX_LENGTH),
});

export type DocumentBranding = z.infer<typeof documentBranding>;

export type DocumentLogo = NonNullable<DocumentBranding["logo"]>;
