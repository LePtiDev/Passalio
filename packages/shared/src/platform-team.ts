import * as z from "zod";
import { PLATFORM_ROLES } from "./platform-permissions";

const platformRole = z.enum(PLATFORM_ROLES);

export const inviteTeammateBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  role: platformRole,
});

export type InviteTeammateBody = z.infer<typeof inviteTeammateBody>;

export const changeTeammateRoleBody = z.object({ role: platformRole });

export type ChangeTeammateRoleBody = z.infer<typeof changeTeammateRoleBody>;

export const teammateResponse = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: platformRole,
  isTwoFactorEnabled: z.boolean(),
  lastSignInAt: z.string().nullable(),
});

export const pendingTeamInvitationResponse = z.object({
  id: z.string(),
  email: z.string(),
  role: platformRole,
  inviterName: z.string().nullable(),
  sentAt: z.string(),
  expiresAt: z.string(),
});

export const teamResponse = z.object({
  members: z.array(teammateResponse),
  invitations: z.array(pendingTeamInvitationResponse),
});

export const teamInvitationDetailsResponse = z.object({
  invitation: z.object({
    role: platformRole,
    email: z.string(),
    inviterName: z.string().nullable(),
  }),
});

export type TeammateResponse = z.infer<typeof teammateResponse>;
export type PendingTeamInvitationResponse = z.infer<typeof pendingTeamInvitationResponse>;
export type TeamResponse = z.infer<typeof teamResponse>;
export type TeamInvitationDetailsResponse = z.infer<typeof teamInvitationDetailsResponse>;
