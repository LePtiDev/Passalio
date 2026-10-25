import {
  BRAND_COLORS,
  CONTACT_TEXT_MAX_LENGTH,
  DOCUMENT_NUMBER_PREFIX_PATTERN,
  DOCUMENT_TEMPLATES,
  DOCUMENT_TEXT_MAX_LENGTH,
  MAX_FIRST_DOCUMENT_NUMBER,
} from "@passalio/shared";
import * as z from "zod";
import type { DocumentSettings, SettingsChanges } from "./document-settings-api";
import type { OrganizationProfile } from "./identity-api";
import { settingsFr } from "./settings-fr";

const text = settingsFr.documents.errors;

export const NUMBER_WIDTH = 4;

const longText = z.string().trim().max(DOCUMENT_TEXT_MAX_LENGTH, { error: text.tooLong });

export const documentSettingsSchema = z.object({
  documentTemplate: z.enum(DOCUMENT_TEMPLATES),
  brandColor: z.enum(BRAND_COLORS),
  phone: z.string().trim().max(30),
  contactEmail: z
    .string()
    .trim()
    .max(CONTACT_TEXT_MAX_LENGTH, { error: text.email })
    .refine((value) => value === "" || z.email().safeParse(value).success, { error: text.email }),
  website: z.string().trim().max(CONTACT_TEXT_MAX_LENGTH),
  qualification: z.string().trim().max(120),
  customerMessage: longText,
  footerText: longText,
  documentNumberPrefix: z.string().regex(DOCUMENT_NUMBER_PREFIX_PATTERN, { error: text.prefix }),
  nextDocumentNumber: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, { error: text.nextNumber })
    .refine((value) => Number(value) >= 1 && Number(value) <= MAX_FIRST_DOCUMENT_NUMBER, {
      error: text.nextNumber,
    }),
});

export type DocumentSettingsValues = z.input<typeof documentSettingsSchema>;

export const documentSettingsOf = (
  organization: OrganizationProfile,
  settings: DocumentSettings,
): DocumentSettingsValues => ({
  documentTemplate: settings.documentTemplate,
  brandColor: organization.brandColor,
  phone: organization.phone ?? "",
  contactEmail: settings.contactEmail ?? "",
  website: settings.website ?? "",
  qualification: settings.qualification ?? "",
  customerMessage: settings.customerMessage ?? "",
  footerText: settings.footerText ?? "",
  documentNumberPrefix: organization.documentNumberPrefix,
  nextDocumentNumber: String(organization.nextDocumentNumber).padStart(NUMBER_WIDTH, "0"),
});

const textOrNull = (value: string) => (value.trim() === "" ? null : value.trim());

export const documentSettingsChanges = (values: DocumentSettingsValues): SettingsChanges => ({
  documentTemplate: values.documentTemplate,
  brandColor: values.brandColor,
  phone: textOrNull(values.phone),
  contactEmail: textOrNull(values.contactEmail),
  website: textOrNull(values.website),
  qualification: textOrNull(values.qualification),
  customerMessage: textOrNull(values.customerMessage),
  footerText: textOrNull(values.footerText),
  documentNumberPrefix: values.documentNumberPrefix,
  nextDocumentNumber: Number(values.nextDocumentNumber),
});

export const nextCertificateNumber = (
  values: Pick<DocumentSettingsValues, "documentNumberPrefix" | "nextDocumentNumber">,
) =>
  `${values.documentNumberPrefix}${values.nextDocumentNumber.trim().padStart(NUMBER_WIDTH, "0")}`;
