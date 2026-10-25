import type { DocumentSettings } from "@/contexts/identity/document-settings-api";
import { jsonReply } from "./fake-api";

export const DOCUMENT_SETTINGS_ROUTE = "GET /api/organization/document-settings";
export const UPDATE_ORGANIZATION_ROUTE = "PATCH /api/organization";
export const REMOVE_LOGO_ROUTE = "DELETE /api/organization/logo";
export const UPLOAD_LOGO_ROUTE = "PUT /api/organization/logo";

export const documentSettings = (overrides: Partial<DocumentSettings> = {}): DocumentSettings => ({
  legalForm: "sarl",
  shareCapitalEuros: 5000,
  registryKind: "rcs",
  registryCity: "Lyon",
  apeCode: "4322B",
  qualification: null,
  documentTemplate: "banner",
  contactEmail: null,
  website: null,
  customerMessage: null,
  footerText: null,
  hasReservedNumbers: false,
  missingLegalMentions: [],
  ...overrides,
});

export const documentSettingsReply = (overrides: Partial<DocumentSettings> = {}) =>
  jsonReply({ settings: documentSettings(overrides) });
