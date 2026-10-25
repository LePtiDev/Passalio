import { rateLimits } from "@passalio/db";
import { newId } from "@passalio/shared";
import { sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { VisitorRateLimit } from "../domain/website-callback-ports";

export const WEBSITE_CALLBACKS_PER_HOUR = 5;

const WINDOW_MS = 60 * 60 * 1000;

const UNKNOWN_VISITOR = "unknown";

const hashOf = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const createD1VisitorRateLimit = (database: Database): VisitorRateLimit => ({
  isAllowed: async ({ ipAddress }, now) => {
    const at = now.getTime();
    const key = `website-callback:${await hashOf(ipAddress ?? UNKNOWN_VISITOR)}`;
    const isNewWindow = sql`${at} - ${rateLimits.lastRequest} >= ${WINDOW_MS}`;
    const row = await database
      .insert(rateLimits)
      .values({ id: newId(), key, count: 1, lastRequest: at })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${isNewWindow} THEN 1 ELSE ${rateLimits.count} + 1 END`,
          lastRequest: sql`CASE WHEN ${isNewWindow} THEN ${at} ELSE ${rateLimits.lastRequest} END`,
        },
      })
      .returning({ count: rateLimits.count })
      .get();
    return row.count <= WEBSITE_CALLBACKS_PER_HOUR;
  },
});
