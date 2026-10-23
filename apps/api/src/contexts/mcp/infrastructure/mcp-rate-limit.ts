import { rateLimits } from "@passalio/db";
import { newId } from "@passalio/shared";
import { sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";

export const MCP_CALLS_PER_MINUTE = 60;

const WINDOW_MS = 60 * 1000;

export const countMcpCall = async (database: Database, userId: string, now: Date) => {
  const at = now.getTime();
  const isNewWindow = sql`${at} - ${rateLimits.lastRequest} >= ${WINDOW_MS}`;
  const row = await database
    .insert(rateLimits)
    .values({ id: newId(), key: `mcp:${userId}`, count: 1, lastRequest: at })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${isNewWindow} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        lastRequest: sql`CASE WHEN ${isNewWindow} THEN ${at} ELSE ${rateLimits.lastRequest} END`,
      },
    })
    .returning({ count: rateLimits.count })
    .get();
  return row.count <= MCP_CALLS_PER_MINUTE;
};
