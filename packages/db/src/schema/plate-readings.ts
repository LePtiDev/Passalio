import { PLATE_READING_STATUSES } from "@passalio/shared";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, timestampColumns } from "../columns";
import { organizations } from "./organizations";

export const plateReadings = sqliteTable(
  "plate_readings",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").notNull(),
    day: text("day").notNull(),
    status: text("status", { enum: PLATE_READING_STATUSES }).notNull(),
    fieldCount: integer("field_count").notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    traceId: text("trace_id").notNull(),
    ...timestampColumns(),
  },
  (table) => [index("plate_readings_organization_id_day_idx").on(table.organizationId, table.day)],
);
