import { invitations, members } from "@passalio/db";
import { and, asc, eq, gt } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { InvitationRepository } from "../domain/identity-ports";

const byId = (organizationId: string, invitationId: string) =>
  and(eq(invitations.organizationId, organizationId), eq(invitations.id, invitationId));

const pendingIn = (organizationId: string) =>
  and(eq(invitations.organizationId, organizationId), eq(invitations.status, "pending"));

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
      .where(byId(organizationId, invitationId))
      .get(),
  accept: async (invitation, member) => {
    await database.batch([
      database
        .update(invitations)
        .set({ status: "accepted" })
        .where(byId(invitation.organizationId, invitation.id)),
      database.insert(members).values(member),
    ]);
  },
  listPending: async (organizationId, { limit, afterId }) =>
    database
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
        sentAt: invitations.createdAt,
      })
      .from(invitations)
      .where(
        afterId === undefined
          ? pendingIn(organizationId)
          : and(pendingIn(organizationId), gt(invitations.id, afterId)),
      )
      .orderBy(asc(invitations.id))
      .limit(limit)
      .all(),
  renew: async (organizationId, invitationId, expiresAt) => {
    await database.update(invitations).set({ expiresAt }).where(byId(organizationId, invitationId));
  },
  cancel: async (organizationId, invitationId) => {
    await database
      .update(invitations)
      .set({ status: "canceled" })
      .where(byId(organizationId, invitationId));
  },
});
