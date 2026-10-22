import { equipments } from "@passalio/db";
import { and, asc, eq, getTableColumns, inArray, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { EquipmentRepository } from "../domain/customer-ports";

const { deletedAt: _equipmentDeletedAt, ...EQUIPMENT_COLUMNS } = getTableColumns(equipments);

const activeInOrganization = (organizationId: string) =>
  and(eq(equipments.organizationId, organizationId), isNull(equipments.deletedAt));

export const createD1EquipmentRepository = (database: Database): EquipmentRepository => ({
  exists: async (id) =>
    (await database
      .select({ id: equipments.id })
      .from(equipments)
      .where(eq(equipments.id, id))
      .get()) !== undefined,
  create: async (equipment, replacement) => {
    await (replacement === undefined
      ? database.insert(equipments).values(equipment)
      : database.batch([
          database.insert(equipments).values(equipment),
          database
            .update(equipments)
            .set({
              status: "removed",
              removedOn: replacement.removedOn,
              replacedByEquipmentId: equipment.id,
              updatedAt: equipment.updatedAt,
            })
            .where(
              and(
                activeInOrganization(equipment.organizationId),
                eq(equipments.id, replacement.replaced.id),
              ),
            ),
        ]));
  },
  findById: async (organizationId, equipmentId) =>
    database
      .select(EQUIPMENT_COLUMNS)
      .from(equipments)
      .where(and(activeInOrganization(organizationId), eq(equipments.id, equipmentId)))
      .get(),
  update: async (organizationId, equipmentId, changes) => {
    await database
      .update(equipments)
      .set(changes)
      .where(and(activeInOrganization(organizationId), eq(equipments.id, equipmentId)));
  },
  listBySites: async (organizationId, siteIds) =>
    siteIds.length === 0
      ? []
      : database
          .select(EQUIPMENT_COLUMNS)
          .from(equipments)
          .where(
            and(activeInOrganization(organizationId), inArray(equipments.siteId, [...siteIds])),
          )
          .orderBy(asc(equipments.createdAt))
          .all(),
});
