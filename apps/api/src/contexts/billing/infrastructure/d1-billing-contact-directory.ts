import { invitations, members, users } from "@passalio/db";
import { TECHNICIAN_ROLES } from "@passalio/shared";
import { and, count, eq, inArray } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { BillingContactDirectory } from "../domain/billing-ports";

export const createD1BillingContactDirectory = (database: Database): BillingContactDirectory => ({
  findEmail: async (userId) =>
    (await database.select({ email: users.email }).from(users).where(eq(users.id, userId)).get())
      ?.email,
  findOwnerName: async (organizationId) =>
    (
      await database
        .select({ name: users.name })
        .from(members)
        .innerJoin(users, eq(users.id, members.userId))
        .where(and(eq(members.organizationId, organizationId), eq(members.role, "owner")))
        .get()
    )?.name,
  countTechnicians: async (organizationId) =>
    (
      await database
        .select({ technicians: count() })
        .from(members)
        .where(
          and(eq(members.organizationId, organizationId), inArray(members.role, TECHNICIAN_ROLES)),
        )
        .get()
    )?.technicians ?? 0,
  countPendingTechnicianInvitations: async (organizationId) =>
    (
      await database
        .select({ pending: count() })
        .from(invitations)
        .where(
          and(
            eq(invitations.organizationId, organizationId),
            eq(invitations.status, "pending"),
            inArray(invitations.role, TECHNICIAN_ROLES),
          ),
        )
        .get()
    )?.pending ?? 0,
});
