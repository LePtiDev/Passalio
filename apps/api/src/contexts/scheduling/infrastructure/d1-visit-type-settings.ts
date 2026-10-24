import { organizations } from "@passalio/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { VisitTypeSettingsRepository } from "../domain/visit-type-ports";

const activeOrganization = (organizationId: string) =>
  and(eq(organizations.id, organizationId), isNull(organizations.deletedAt));

export const createD1VisitTypeSettings = (database: Database): VisitTypeSettingsRepository => ({
  find: async (organizationId) =>
    database
      .select({ trades: organizations.trades, durations: organizations.visitDurations })
      .from(organizations)
      .where(activeOrganization(organizationId))
      .get(),
  saveDurations: async (organizationId, durations) => {
    await database
      .update(organizations)
      .set({ visitDurations: durations, updatedAt: new Date() })
      .where(activeOrganization(organizationId));
  },
});
