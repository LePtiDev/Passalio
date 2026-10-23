import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const activityDays = sqliteTable(
  "activity_days",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.day] }),
    index("activity_days_day_idx").on(table.day),
  ],
);
