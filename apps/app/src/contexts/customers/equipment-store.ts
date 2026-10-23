import {
  calendarDateOf,
  newId,
  type EquipmentChanges,
  type EquipmentFields,
  type EquipmentPhotoKind,
} from "@passalio/shared";
import type { LocalDatabase } from "@/lib/db/local-database";
import { enqueue } from "@/lib/db/outbox";
import { requestSync } from "@/lib/sync/sync-scheduler";
import { definedChanges, localEquipment, type LocalActor } from "./local-customer-records";

export const addEquipment = async (
  database: LocalDatabase,
  actor: LocalActor,
  input: {
    readonly siteId: string;
    readonly equipment: EquipmentFields;
    readonly replacesEquipmentId?: string | undefined;
  },
) => {
  const at = new Date();
  const equipmentId = newId();
  await database.transaction("rw", [database.equipments, database.outbox], async () => {
    await database.equipments.add(
      localEquipment(input.equipment, {
        id: equipmentId,
        organizationId: actor.organizationId,
        siteId: input.siteId,
        at: at.toISOString(),
      }),
    );
    if (input.replacesEquipmentId !== undefined) {
      await database.equipments.update(input.replacesEquipmentId, {
        status: "removed",
        removedOn: input.equipment.commissionedOn ?? calendarDateOf(at),
        replacedByEquipmentId: equipmentId,
        updatedAt: at.toISOString(),
      });
    }
    await enqueue(database, {
      type: "add_equipment",
      equipmentId,
      siteId: input.siteId,
      equipment: input.equipment,
      ...(input.replacesEquipmentId === undefined
        ? {}
        : { replacesEquipmentId: input.replacesEquipmentId }),
    });
  });
  requestSync(database);
  return equipmentId;
};

export const updateEquipment = async (
  database: LocalDatabase,
  equipmentId: string,
  changes: EquipmentChanges,
) => {
  const at = new Date().toISOString();
  await database.transaction("rw", [database.equipments, database.outbox], async () => {
    await database.equipments
      .where("id")
      .equals(equipmentId)
      .modify((equipment) => {
        Object.assign(equipment, definedChanges(changes));
        equipment.updatedAt = at;
      });
    await enqueue(database, { type: "update_equipment", equipmentId, changes });
  });
  requestSync(database);
};

export const removeEquipment = async (database: LocalDatabase, equipmentId: string) => {
  const at = new Date();
  const removedOn = calendarDateOf(at);
  await database.transaction("rw", [database.equipments, database.outbox], async () => {
    await database.equipments.update(equipmentId, {
      status: "removed",
      removedOn,
      updatedAt: at.toISOString(),
    });
    await enqueue(database, { type: "remove_equipment", equipmentId, removedOn });
  });
  requestSync(database);
};

export const addEquipmentPhoto = async (
  database: LocalDatabase,
  actor: LocalActor,
  input: { readonly equipmentId: string; readonly kind: EquipmentPhotoKind; readonly blob: Blob },
) => {
  const id = newId();
  const at = new Date().toISOString();
  await database.transaction("rw", [database.photos, database.pendingPhotos], async () => {
    await database.pendingPhotos.add({
      id,
      equipmentId: input.equipmentId,
      kind: input.kind,
      takenAt: at,
      blob: input.blob,
    });
    await database.photos.add({
      id,
      organizationId: actor.organizationId,
      equipmentId: input.equipmentId,
      kind: input.kind,
      contentType: input.blob.type,
      takenAt: at,
      createdByUserId: actor.userId,
      createdAt: at,
      updatedAt: at,
      deletedAt: null,
    });
  });
  requestSync(database);
  return id;
};
