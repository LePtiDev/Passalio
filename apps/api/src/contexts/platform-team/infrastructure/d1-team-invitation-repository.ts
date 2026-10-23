import { platformInvitations, users } from "@passalio/db";
import { isPlatformRole } from "@passalio/shared";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { TeamInvitation } from "../domain/team-models";
import type { TeamInvitationRepository } from "../domain/team-ports";

const MAX_PENDING_INVITATIONS = 100;

const invitationColumns = {
  id: platformInvitations.id,
  email: platformInvitations.email,
  role: platformInvitations.role,
  status: platformInvitations.status,
  inviterId: platformInvitations.inviterId,
  expiresAt: platformInvitations.expiresAt,
  createdAt: platformInvitations.createdAt,
};

type InvitationRow = Omit<TeamInvitation, "role"> & { readonly role: string };

const toInvitation = (row: InvitationRow | undefined): TeamInvitation | undefined =>
  row !== undefined && isPlatformRole(row.role) ? { ...row, role: row.role } : undefined;

const isPending = eq(platformInvitations.status, "pending");

export const createD1TeamInvitationRepository = (database: Database): TeamInvitationRepository => ({
  create: async (invitation) => {
    await database.insert(platformInvitations).values(invitation);
  },
  findById: async (invitationId) =>
    toInvitation(
      await database
        .select(invitationColumns)
        .from(platformInvitations)
        .where(eq(platformInvitations.id, invitationId))
        .get(),
    ),
  findPendingByEmail: async (email) =>
    toInvitation(
      await database
        .select(invitationColumns)
        .from(platformInvitations)
        .where(and(eq(platformInvitations.email, email), isPending))
        .get(),
    ),
  listPending: async () => {
    const rows = await database
      .select({
        id: platformInvitations.id,
        email: platformInvitations.email,
        role: platformInvitations.role,
        inviterName: users.name,
        sentAt: platformInvitations.createdAt,
        expiresAt: platformInvitations.expiresAt,
      })
      .from(platformInvitations)
      .leftJoin(users, eq(users.id, platformInvitations.inviterId))
      .where(isPending)
      .orderBy(desc(platformInvitations.createdAt))
      .limit(MAX_PENDING_INVITATIONS)
      .all();
    return rows.flatMap(({ role, ...row }) => (isPlatformRole(role) ? [{ ...row, role }] : []));
  },
  renew: async (invitationId, expiresAt) => {
    await database
      .update(platformInvitations)
      .set({ expiresAt })
      .where(eq(platformInvitations.id, invitationId));
  },
  cancel: async (invitationId) => {
    await database
      .update(platformInvitations)
      .set({ status: "canceled" })
      .where(eq(platformInvitations.id, invitationId));
  },
  accept: async (invitation, userId) => {
    await database.batch([
      database
        .update(platformInvitations)
        .set({ status: "accepted" })
        .where(eq(platformInvitations.id, invitation.id)),
      database
        .update(users)
        .set({ role: invitation.role, updatedAt: new Date() })
        .where(eq(users.id, userId)),
    ]);
  },
});
