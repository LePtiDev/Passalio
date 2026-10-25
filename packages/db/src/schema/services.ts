import { SERVICE_DOCUMENTS, TRADE_IDS } from "@passalio/trades";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, timestampColumns } from "../columns";
import { organizations } from "./organizations";

export const services = sqliteTable(
  "services",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents"),
    document: text("document", { enum: SERVICE_DOCUMENTS }).notNull(),
    trade: text("trade", { enum: TRADE_IDS }),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    ...timestampColumns(),
  },
  (table) => [
    index("services_organization_id_created_at_idx").on(table.organizationId, table.createdAt),
  ],
);
