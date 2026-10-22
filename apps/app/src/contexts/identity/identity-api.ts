import {
  BRAND_COLORS,
  ok,
  ORGANIZATION_ROLES,
  TEAM_SIZES,
  type OrganizationRole,
} from "@passalio/shared";
import { TRADE_IDS } from "@passalio/trades";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const roleSchema = z.enum(ORGANIZATION_ROLES);

const actorResponse = z.object({
  actor: z.object({
    userId: z.string(),
    organizationId: z.string(),
    role: roleSchema,
    isImpersonating: z.boolean(),
  }),
});

const teamMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
});

const membersPageResponse = z.object({
  members: z.array(teamMemberSchema),
  nextCursor: z.string().nullable(),
});

const organizationResponse = z.object({
  organization: z.object({ id: z.string(), name: z.string() }),
});

const noContent = z.undefined();

const organizationProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  siret: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  teamSize: z.enum(TEAM_SIZES).nullable(),
  trades: z.array(z.enum(TRADE_IDS)),
  brandColor: z.enum(BRAND_COLORS),
  documentNumberPrefix: z.string(),
  nextDocumentNumber: z.number(),
  hasLogo: z.boolean(),
  isOnboardingCompleted: z.boolean(),
});

const organizationProfileResponse = z.object({ organization: organizationProfileSchema });

const companySchema = z.object({
  name: z.string(),
  siret: z.string(),
  address: z.string(),
  postalCode: z.string(),
  city: z.string(),
});

const companySearchResponse = z.object({ companies: z.array(companySchema) });

export type CurrentActor = z.infer<typeof actorResponse>["actor"];
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type MembersPage = z.infer<typeof membersPageResponse>;
export type OrganizationProfile = z.infer<typeof organizationProfileSchema>;
export type CompanySummary = z.infer<typeof companySchema>;
export type NewOrganization = Pick<
  OrganizationProfile,
  "name" | "siret" | "address" | "phone" | "teamSize"
>;
export type OrganizationChanges = Partial<
  Omit<OrganizationProfile, "id" | "hasLogo" | "isOnboardingCompleted">
>;

export const identityApi = {
  fetchActor: async () => {
    const result = await apiRequest("/me", actorResponse);
    return result.isOk ? ok(result.value.actor) : result;
  },
  fetchMembers: (cursor: string | null) =>
    apiRequest(
      cursor === null ? "/members" : `/members?cursor=${encodeURIComponent(cursor)}`,
      membersPageResponse,
    ),
  createOrganization: (organization: NewOrganization) =>
    apiRequest("/organizations", organizationResponse, { method: "POST", body: organization }),
  fetchOrganization: async () => {
    const result = await apiRequest("/organization", organizationProfileResponse);
    return result.isOk ? ok(result.value.organization) : result;
  },
  updateOrganization: (changes: OrganizationChanges) =>
    apiRequest("/organization", noContent, { method: "PATCH", body: changes }),
  uploadLogo: (file: File) => apiRequest("/organization/logo", noContent, { method: "PUT", file }),
  completeOnboarding: () =>
    apiRequest("/organization/onboarding-completion", noContent, { method: "POST" }),
  searchCompanies: async (query: string) => {
    const result = await apiRequest(
      `/company-search?q=${encodeURIComponent(query)}`,
      companySearchResponse,
    );
    return result.isOk ? ok(result.value.companies) : result;
  },
  inviteMember: (email: string, role: OrganizationRole) =>
    apiRequest("/invitations", z.unknown(), { method: "POST", body: { email, role } }),
  changeMemberRole: (memberId: string, role: OrganizationRole) =>
    apiRequest(`/members/${memberId}`, noContent, { method: "PATCH", body: { role } }),
  removeMember: (memberId: string) =>
    apiRequest(`/members/${memberId}`, noContent, { method: "DELETE" }),
  transferOwnership: (memberId: string) =>
    apiRequest("/ownership-transfer", noContent, { method: "POST", body: { memberId } }),
  acceptInvitation: (organizationId: string, invitationId: string) =>
    apiRequest(`/invitations/${organizationId}/${invitationId}/accept`, z.unknown(), {
      method: "POST",
    }),
};
