import { DOCUMENT_TEMPLATES, ok } from "@passalio/shared";
import { LEGAL_FORMS, LEGAL_MENTIONS, REGISTRY_KINDS } from "@passalio/trades";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";
import type { OrganizationChanges } from "./identity-api";

const documentSettingsSchema = z.object({
  legalForm: z.enum(LEGAL_FORMS).nullable(),
  shareCapitalEuros: z.number().nullable(),
  registryKind: z.enum(REGISTRY_KINDS).nullable(),
  registryCity: z.string().nullable(),
  apeCode: z.string().nullable(),
  qualification: z.string().nullable(),
  documentTemplate: z.enum(DOCUMENT_TEMPLATES),
  contactEmail: z.string().nullable(),
  website: z.string().nullable(),
  customerMessage: z.string().nullable(),
  footerText: z.string().nullable(),
  hasReservedNumbers: z.boolean(),
  missingLegalMentions: z.array(z.enum(LEGAL_MENTIONS)),
});

const documentSettingsResponse = z.object({ settings: documentSettingsSchema });

export type DocumentSettings = z.infer<typeof documentSettingsSchema>;

export type SettingsChanges = OrganizationChanges &
  Partial<Omit<DocumentSettings, "hasReservedNumbers" | "missingLegalMentions">>;

const noContent = z.undefined();

export const documentSettingsApi = {
  fetchSettings: async () => {
    const result = await apiRequest("/organization/document-settings", documentSettingsResponse);
    return result.isOk ? ok(result.value.settings) : result;
  },
  updateSettings: (changes: SettingsChanges) =>
    apiRequest("/organization", noContent, { method: "PATCH", body: changes }),
  removeLogo: () => apiRequest("/organization/logo", noContent, { method: "DELETE" }),
};
