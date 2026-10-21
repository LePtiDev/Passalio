import { ok, ORGANIZATION_ROLES, type OrganizationRole } from "@passalio/shared";
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

export type CurrentActor = z.infer<typeof actorResponse>["actor"];
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type MembersPage = z.infer<typeof membersPageResponse>;

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
  createOrganization: (name: string) =>
    apiRequest("/organizations", organizationResponse, { method: "POST", body: { name } }),
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
