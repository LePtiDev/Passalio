import * as z from "zod";

export const teammateParams = z.object({ userId: z.string().min(1).max(64) });

export const teamInvitationParams = z.object({ invitationId: z.string().min(1).max(64) });
