import { equipmentPhotos } from "@passalio/db";
import { and, asc, eq, getTableColumns, inArray, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { PhotoRepository } from "../domain/customer-ports";

const { deletedAt: _photoDeletedAt, ...PHOTO_COLUMNS } = getTableColumns(equipmentPhotos);

const activeInOrganization = (organizationId: string) =>
  and(eq(equipmentPhotos.organizationId, organizationId), isNull(equipmentPhotos.deletedAt));

export const createD1PhotoRepository = (database: Database): PhotoRepository => ({
  exists: async (id) =>
    (await database
      .select({ id: equipmentPhotos.id })
      .from(equipmentPhotos)
      .where(eq(equipmentPhotos.id, id))
      .get()) !== undefined,
  create: async (photo) => {
    await database.insert(equipmentPhotos).values(photo);
  },
  findById: async (organizationId, photoId) =>
    database
      .select(PHOTO_COLUMNS)
      .from(equipmentPhotos)
      .where(and(activeInOrganization(organizationId), eq(equipmentPhotos.id, photoId)))
      .get(),
  listByEquipments: async (organizationId, equipmentIds) =>
    equipmentIds.length === 0
      ? []
      : database
          .select(PHOTO_COLUMNS)
          .from(equipmentPhotos)
          .where(
            and(
              activeInOrganization(organizationId),
              inArray(equipmentPhotos.equipmentId, [...equipmentIds]),
            ),
          )
          .orderBy(asc(equipmentPhotos.takenAt))
          .all(),
});
