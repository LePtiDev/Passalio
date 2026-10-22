import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn } from "../columns";

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    id: idColumn(),
    key: text("key").notNull().unique(),
    count: integer("count").notNull(),
    lastRequest: integer("last_request").notNull(),
  },
  (table) => [index("rate_limits_last_request_idx").on(table.lastRequest)],
);
