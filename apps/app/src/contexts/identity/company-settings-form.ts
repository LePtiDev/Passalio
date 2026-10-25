import { LEGAL_FORMS, REGISTRY_KINDS, requiresShareCapital } from "@passalio/trades";
import * as z from "zod";
import type { SettingsChanges, DocumentSettings } from "./document-settings-api";
import type { OrganizationProfile } from "./identity-api";
import { settingsFr } from "./settings-fr";

const text = settingsFr.company.errors;

const digitsOf = (value: string) => value.replaceAll(/[\s.]/g, "");

export const companySettingsSchema = z
  .object({
    name: z.string().trim().min(2, { error: text.name }).max(100, { error: text.name }),
    legalForm: z.enum(LEGAL_FORMS, { error: text.legalForm }).nullable(),
    siret: z.string().refine((value) => /^\d{14}$/.test(digitsOf(value)), { error: text.siret }),
    shareCapital: z
      .string()
      .refine((value) => value.trim() === "" || /^[1-9]\d{0,9}$/.test(digitsOf(value)), {
        error: text.shareCapital,
      }),
    registryKind: z.enum(REGISTRY_KINDS, { error: text.registry }).nullable(),
    registryCity: z.string().trim().max(120),
    apeCode: z
      .string()
      .refine((value) => value.trim() === "" || /^\d{4}[A-Za-z]$/.test(digitsOf(value)), {
        error: text.apeCode,
      }),
    address: z.string().trim().min(1, { error: text.address }).max(300, { error: text.address }),
  })
  .superRefine((values, context) => {
    if (values.legalForm === null) {
      context.addIssue({ code: "custom", path: ["legalForm"], message: text.legalForm });
    }
    if (values.registryKind === null) {
      context.addIssue({ code: "custom", path: ["registryKind"], message: text.registry });
    }
    if (values.registryKind === "rcs" && values.registryCity === "") {
      context.addIssue({ code: "custom", path: ["registryCity"], message: text.registryCity });
    }
    if (
      values.legalForm !== null &&
      requiresShareCapital(values.legalForm) &&
      values.shareCapital.trim() === ""
    ) {
      context.addIssue({ code: "custom", path: ["shareCapital"], message: text.shareCapital });
    }
  });

export type CompanySettingsValues = z.input<typeof companySettingsSchema>;

export const companySettingsOf = (
  organization: OrganizationProfile,
  settings: DocumentSettings,
): CompanySettingsValues => ({
  name: organization.name,
  legalForm: settings.legalForm,
  siret: organization.siret ?? "",
  shareCapital: settings.shareCapitalEuros === null ? "" : String(settings.shareCapitalEuros),
  registryKind: settings.registryKind,
  registryCity: settings.registryCity ?? "",
  apeCode: settings.apeCode ?? "",
  address: organization.address ?? "",
});

const textOrNull = (value: string) => (value.trim() === "" ? null : value.trim());

export const companySettingsChanges = (values: CompanySettingsValues): SettingsChanges => ({
  name: values.name.trim(),
  legalForm: values.legalForm,
  siret: digitsOf(values.siret),
  shareCapitalEuros:
    values.shareCapital.trim() === "" ? null : Number(digitsOf(values.shareCapital)),
  registryKind: values.registryKind,
  registryCity: values.registryKind === "rcs" ? textOrNull(values.registryCity) : null,
  apeCode: textOrNull(values.apeCode),
  address: values.address.trim(),
});
