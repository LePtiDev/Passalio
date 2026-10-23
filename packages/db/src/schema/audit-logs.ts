import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn } from "../columns";

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: idColumn(),
    organizationId: text("organization_id"),
    actorUserId: text("actor_user_id"),
    impersonatorUserId: text("impersonator_user_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    data: text("data", { mode: "json" }).$type<Readonly<Record<string, string>>>(),
    traceId: text("trace_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("audit_logs_organization_id_created_at_idx").on(table.organizationId, table.createdAt),
    index("audit_logs_action_created_at_idx").on(table.action, table.createdAt),
  ],
);
