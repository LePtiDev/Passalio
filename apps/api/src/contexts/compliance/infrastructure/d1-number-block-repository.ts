import { documentNumberBlocks, organizations } from "@passalio/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { NumberBlockRepository } from "../domain/compliance-ports";

export const createD1NumberBlockRepository = (database: Database): NumberBlockRepository => ({
  reserve: async ({ id, organizationId, userId, deviceId, size, at }) => {
    await database.batch([
      database
        .update(organizations)
        .set({ nextDocumentNumber: sql`${organizations.nextDocumentNumber} + ${size}` })
        .where(eq(organizations.id, organizationId)),
      database.insert(documentNumberBlocks).select(
        database
          .select({
            id: sql<string>`${id}`.as("id"),
            organizationId: organizations.id,
            userId: sql<string>`${userId}`.as("user_id"),
            deviceId: sql<string>`${deviceId}`.as("device_id"),
            numberPrefix: organizations.documentNumberPrefix,
            firstNumber: sql<number>`${organizations.nextDocumentNumber} - ${size}`.as(
              "first_number",
            ),
            lastNumber: sql<number>`${organizations.nextDocumentNumber} - 1`.as("last_number"),
            createdAt: sql<Date>`${at.getTime()}`.as("created_at"),
          })
          .from(organizations)
          .where(eq(organizations.id, organizationId)),
      ),
    ]);
    const block = await database
      .select()
      .from(documentNumberBlocks)
      .where(eq(documentNumberBlocks.id, id))
      .get();
    if (block === undefined) {
      throw new Error("number_block_not_reserved");
    }
    return block;
  },
  findCovering: async (organizationId, userId, number) =>
    database
      .select()
      .from(documentNumberBlocks)
      .where(
        and(
          eq(documentNumberBlocks.organizationId, organizationId),
          eq(documentNumberBlocks.userId, userId),
          gte(documentNumberBlocks.lastNumber, number),
          lte(documentNumberBlocks.firstNumber, number),
        ),
      )
      .get(),
});
