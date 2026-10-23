import { DOCUMENT_KINDS } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, syncedTimestampColumns } from "../columns";
import { equipments } from "./equipments";
import { interventions } from "./interventions";
import { organizations } from "./organizations";

export const documents = sqliteTable(
  "documents",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    interventionId: text("intervention_id")
      .notNull()
      .references(() => interventions.id),
    equipmentId: text("equipment_id")
      .notNull()
      .references(() => equipments.id),
    trade: text("trade").$type<TradeId>().notNull(),
    kind: text("kind", { enum: DOCUMENT_KINDS }).notNull(),
    templateVersion: integer("template_version").notNull(),
    number: integer("number").notNull(),
    numberPrefix: text("number_prefix").notNull(),
    deviceId: text("device_id").notNull(),
    signedByUserId: text("signed_by_user_id").notNull(),
    signedAt: integer("signed_at", { mode: "timestamp_ms" }).notNull(),
    completedOn: text("completed_on").notNull(),
    cancelsDocumentId: text("cancels_document_id"),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    ...syncedTimestampColumns(),
  },
  (table) => [
    uniqueIndex("documents_organization_id_number_idx").on(table.organizationId, table.number),
    uniqueIndex("documents_organization_id_cancels_document_id_idx").on(
      table.organizationId,
      table.cancelsDocumentId,
    ),
    index("documents_organization_id_updated_at_idx").on(table.organizationId, table.updatedAt),
    index("documents_organization_id_signed_by_user_id_updated_at_idx").on(
      table.organizationId,
      table.signedByUserId,
      table.updatedAt,
    ),
  ],
);

export const documentNumberBlocks = sqliteTable(
  "document_number_blocks",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").notNull(),
    deviceId: text("device_id").notNull(),
    numberPrefix: text("number_prefix").notNull(),
    firstNumber: integer("first_number").notNull(),
    lastNumber: integer("last_number").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("document_number_blocks_organization_id_user_id_last_number_idx").on(
      table.organizationId,
      table.userId,
      table.lastNumber,
    ),
  ],
);
