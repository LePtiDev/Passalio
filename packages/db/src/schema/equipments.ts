import { EQUIPMENT_PHOTO_KINDS, EQUIPMENT_STATUSES } from "@passalio/shared";
import { ENERGIES, EQUIPMENT_KINDS, type EquipmentDetails } from "@passalio/trades";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, syncedTimestampColumns } from "../columns";
import { sites } from "./customers";
import { organizations } from "./organizations";

export const equipments = sqliteTable(
  "equipments",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    kind: text("kind", { enum: EQUIPMENT_KINDS }).notNull(),
    energy: text("energy", { enum: ENERGIES }),
    brand: text("brand"),
    model: text("model"),
    serialNumber: text("serial_number"),
    powerKw: real("power_kw"),
    room: text("room"),
    details: text("details", { mode: "json" }).$type<EquipmentDetails>().notNull(),
    status: text("status", { enum: EQUIPMENT_STATUSES }).notNull(),
    isInstalledByUs: integer("is_installed_by_us", { mode: "boolean" }).notNull(),
    commissionedOn: text("commissioned_on"),
    removedOn: text("removed_on"),
    replacedByEquipmentId: text("replaced_by_equipment_id"),
    lastSweepingOn: text("last_sweeping_on"),
    lastServiceOn: text("last_service_on"),
    nextDueDate: text("next_due_date"),
    notes: text("notes"),
    ...syncedTimestampColumns(),
  },
  (table) => [
    index("equipments_organization_id_site_id_idx").on(table.organizationId, table.siteId),
    index("equipments_organization_id_next_due_date_idx").on(
      table.organizationId,
      table.nextDueDate,
    ),
    index("equipments_organization_id_updated_at_idx").on(table.organizationId, table.updatedAt),
  ],
);

export const equipmentPhotos = sqliteTable(
  "equipment_photos",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    equipmentId: text("equipment_id")
      .notNull()
      .references(() => equipments.id),
    kind: text("kind", { enum: EQUIPMENT_PHOTO_KINDS }).notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    takenAt: integer("taken_at", { mode: "timestamp_ms" }).notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    ...syncedTimestampColumns(),
  },
  (table) => [
    index("equipment_photos_organization_id_equipment_id_idx").on(
      table.organizationId,
      table.equipmentId,
    ),
    index("equipment_photos_organization_id_updated_at_idx").on(
      table.organizationId,
      table.updatedAt,
    ),
  ],
);
