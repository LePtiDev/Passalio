import { invitations, members } from "@passalio/db";
import { and, eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { InvitationRepository } from "../domain/identity-ports";

export const createD1InvitationRepository = (database: Database): InvitationRepository => ({
  create: async (invitation) => {
    await database.insert(invitations).values(invitation);
  },
  findById: async (organizationId, invitationId) =>
    database
      .select({
        id: invitations.id,
        organizationId: invitations.organizationId,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        inviterId: invitations.inviterId,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(and(eq(invitations.organizationId, organizationId), eq(invitations.id, invitationId)))
      .get(),
  accept: async (invitation, member) => {
    await database.batch([
      database
        .update(invitations)
        .set({ status: "accepted" })
        .where(
          and(
            eq(invitations.organizationId, invitation.organizationId),
            eq(invitations.id, invitation.id),
          ),
        ),
      database.insert(members).values(member),
    ]);
  },
});
