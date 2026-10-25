import { invitations, platformInvitations } from "@passalio/db";
import { and, eq, gt } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { PendingInvitationLookup } from "../domain/platform-settings-ports";

export const createD1PendingInvitationLookup = (database: Database): PendingInvitationLookup => ({
  hasPendingInvitation: async (email, now) => {
    const [companyInvitation, teamInvitation] = await database.batch([
      database
        .select({ id: invitations.id })
        .from(invitations)
        .where(
          and(
            eq(invitations.email, email),
            eq(invitations.status, "pending"),
            gt(invitations.expiresAt, now),
          ),
        )
        .limit(1),
      database
        .select({ id: platformInvitations.id })
        .from(platformInvitations)
        .where(
          and(
            eq(platformInvitations.email, email),
            eq(platformInvitations.status, "pending"),
            gt(platformInvitations.expiresAt, now),
          ),
        )
        .limit(1),
    ]);
    return companyInvitation.length > 0 || teamInvitation.length > 0;
  },
});
