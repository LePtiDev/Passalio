import { INTERVENTION_STATUSES, PAYMENT_METHODS, type ServiceLine } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, syncedTimestampColumns } from "../columns";
import { customers, sites } from "./customers";
import { organizations } from "./organizations";

export const interventions = sqliteTable(
  "interventions",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    technicianUserId: text("technician_user_id").notNull(),
    technicianUserIds: text("technician_user_ids", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    scheduledDate: text("scheduled_date").notNull(),
    startTime: text("start_time"),
    durationMinutes: integer("duration_minutes").notNull(),
    visitTypes: text("visit_types", { mode: "json" }).$type<TradeId[]>().notNull().default([]),
    serviceLines: text("service_lines", { mode: "json" })
      .$type<ServiceLine[]>()
      .notNull()
      .default([]),
    equipmentIds: text("equipment_ids", { mode: "json" }).$type<string[]>().notNull(),
    announcedPriceCents: integer("announced_price_cents"),
    notes: text("notes"),
    status: text("status", { enum: INTERVENTION_STATUSES }).notNull(),
    completedOn: text("completed_on"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }),
    paidAmountCents: integer("paid_amount_cents"),
    createdByUserId: text("created_by_user_id").notNull(),
    ...syncedTimestampColumns(),
  },
  (table) => [
    index("interventions_organization_id_updated_at_idx").on(table.organizationId, table.updatedAt),
  ],
);
