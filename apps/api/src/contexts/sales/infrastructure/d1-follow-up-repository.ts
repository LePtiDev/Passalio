import { prospectFollowUps } from "@passalio/db";
import { eq, getTableColumns } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { FollowUpRepository } from "../domain/call-ports";

export const createD1FollowUpRepository = (database: Database): FollowUpRepository => ({
  findByCompany: async (companyId) =>
    database
      .select(getTableColumns(prospectFollowUps))
      .from(prospectFollowUps)
      .where(eq(prospectFollowUps.companyId, companyId))
      .get(),
  qualify: async (companyId, qualification, at) => {
    await database
      .insert(prospectFollowUps)
      .values({ ...qualification, companyId, updatedAt: at })
      .onConflictDoUpdate({
        target: prospectFollowUps.companyId,
        set: { ...qualification, updatedAt: at },
      });
  },
});
