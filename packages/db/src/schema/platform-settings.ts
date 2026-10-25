import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn } from "../columns";
import { users } from "./users";

export const platformSettings = sqliteTable("platform_settings", {
  id: idColumn(),
  isSignUpOpen: integer("is_sign_up_open", { mode: "boolean" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  updatedByUserId: text("updated_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
});
