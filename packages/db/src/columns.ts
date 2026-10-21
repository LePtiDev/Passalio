import { integer, text } from "drizzle-orm/sqlite-core";

export const idColumn = () => text("id").primaryKey();

export const organizationIdColumn = () => text("organization_id").notNull();

export const timestampColumns = () => ({
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const syncedTimestampColumns = () => ({
  ...timestampColumns(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});
