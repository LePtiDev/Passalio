import { organizations } from "@passalio/db";
import { eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { OrganizationTrades } from "../domain/customer-ports";

export const createD1OrganizationTrades = (database: Database): OrganizationTrades => ({
  of: async (organizationId) =>
    (
      await database
        .select({ trades: organizations.trades })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .get()
    )?.trades ?? [],
});
