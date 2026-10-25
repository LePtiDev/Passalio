import {
  BRAND_COLORS,
  CONTACT_TEXT_MAX_LENGTH,
  DOCUMENT_TEMPLATES,
  DOCUMENT_TEXT_MAX_LENGTH,
  MAX_FIRST_DOCUMENT_NUMBER,
  MAX_SHARE_CAPITAL_EUROS,
  ORGANIZATION_ROLES,
  TEAM_SIZES,
} from "@passalio/shared";
import { COMPANY_TEXT_MAX_LENGTH, LEGAL_FORMS, REGISTRY_KINDS, TRADE_IDS } from "@passalio/trades";
import * as z from "zod";
import {
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from "../domain/organization-name";

const organizationName = z
  .string()
  .min(ORGANIZATION_NAME_MIN_LENGTH)
  .max(ORGANIZATION_NAME_MAX_LENGTH);

const companyDetails = {
  siret: z.string().max(20).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  teamSize: z.enum(TEAM_SIZES).nullable().optional(),
};

export const createOrganizationBody = z.object({
  name: organizationName,
  ...companyDetails,
});

export const updateOrganizationBody = z.object({
  name: organizationName.optional(),
  ...companyDetails,
  trades: z.array(z.enum(TRADE_IDS)).max(TRADE_IDS.length).optional(),
  brandColor: z.enum(BRAND_COLORS).optional(),
  documentNumberPrefix: z.string().max(12).optional(),
  nextDocumentNumber: z.int().min(1).max(MAX_FIRST_DOCUMENT_NUMBER).optional(),
  legalForm: z.enum(LEGAL_FORMS).nullable().optional(),
  shareCapitalEuros: z.int().min(1).max(MAX_SHARE_CAPITAL_EUROS).nullable().optional(),
  registryKind: z.enum(REGISTRY_KINDS).nullable().optional(),
  registryCity: z.string().max(COMPANY_TEXT_MAX_LENGTH).nullable().optional(),
  apeCode: z.string().max(10).nullable().optional(),
  qualification: z.string().max(COMPANY_TEXT_MAX_LENGTH).nullable().optional(),
  documentTemplate: z.enum(DOCUMENT_TEMPLATES).optional(),
  contactEmail: z.email().max(CONTACT_TEXT_MAX_LENGTH).nullable().optional(),
  website: z.string().max(CONTACT_TEXT_MAX_LENGTH).nullable().optional(),
  customerMessage: z.string().max(DOCUMENT_TEXT_MAX_LENGTH).nullable().optional(),
  footerText: z.string().max(DOCUMENT_TEXT_MAX_LENGTH).nullable().optional(),
});

export const companySearchQuery = z.object({
  q: z.string().max(100),
});

export const inviteMemberBody = z.object({
  email: z.email().max(254),
  role: z.enum(ORGANIZATION_ROLES),
});

export const changeMemberRoleBody = z.object({
  role: z.enum(ORGANIZATION_ROLES),
});

export const transferOwnershipBody = z.object({
  memberId: z.uuid(),
});

export const listMembersQuery = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(5).max(50).optional(),
});

export const memberParams = z.object({
  memberId: z.uuid(),
});

export const invitationParams = z.object({
  organizationId: z.uuid(),
  invitationId: z.uuid(),
});

export const pendingInvitationParams = z.object({
  invitationId: z.uuid(),
});
