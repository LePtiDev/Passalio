import {
  teamInvitationDetailsResponse,
  teamResponse,
  type InviteTeammateBody,
  type PlatformRole,
} from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const noContent = z.undefined();

export const teamApi = {
  fetchTeam: () => apiRequest("/admin/team", teamResponse),
  invite: (body: InviteTeammateBody) =>
    apiRequest("/admin/team/invitations", z.unknown(), { method: "POST", body }),
  resendInvitation: (invitationId: string) =>
    apiRequest(`/admin/team/invitations/${invitationId}/resend`, z.unknown(), { method: "POST" }),
  cancelInvitation: (invitationId: string) =>
    apiRequest(`/admin/team/invitations/${invitationId}`, noContent, { method: "DELETE" }),
  changeRole: (userId: string, role: PlatformRole) =>
    apiRequest(`/admin/team/members/${userId}`, z.unknown(), { method: "PATCH", body: { role } }),
  remove: (userId: string) =>
    apiRequest(`/admin/team/members/${userId}`, noContent, { method: "DELETE" }),
  fetchInvitation: (invitationId: string) =>
    apiRequest(`/team-invitations/${invitationId}`, teamInvitationDetailsResponse),
  acceptInvitation: (invitationId: string) =>
    apiRequest(`/team-invitations/${invitationId}/accept`, z.unknown(), { method: "POST" }),
};
