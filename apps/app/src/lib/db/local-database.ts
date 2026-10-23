import { Dexie, type EntityTable } from "dexie";
import type {
  CustomerRecord,
  EquipmentRecord,
  OutboxEntry,
  PendingPhoto,
  PhotoRecord,
  SiteRecord,
  SyncRejection,
  SyncStateEntry,
} from "./local-records";

export const LOCAL_DATABASE_PREFIX = "passalio-";

export class LocalDatabase extends Dexie {
  declare customers: EntityTable<CustomerRecord, "id">;
  declare sites: EntityTable<SiteRecord, "id">;
  declare equipments: EntityTable<EquipmentRecord, "id">;
  declare photos: EntityTable<PhotoRecord, "id">;
  declare outbox: EntityTable<OutboxEntry, "seq">;
  declare pendingPhotos: EntityTable<PendingPhoto, "id">;
  declare rejections: EntityTable<SyncRejection, "id">;
  declare syncState: EntityTable<SyncStateEntry, "key">;

  constructor(organizationId: string) {
    super(`${LOCAL_DATABASE_PREFIX}${organizationId}`);
    this.version(1).stores({
      customers: "id, searchName",
      sites: "id, customerId",
      equipments: "id, siteId",
      photos: "id, equipmentId",
      outbox: "++seq, *entityIds",
      pendingPhotos: "id, equipmentId",
      rejections: "id",
      syncState: "key",
    });
  }
}

const openDatabases = new Map<string, LocalDatabase>();

export const localDatabaseOf = (organizationId: string): LocalDatabase => {
  const existing = openDatabases.get(organizationId);
  if (existing !== undefined) {
    return existing;
  }
  const database = new LocalDatabase(organizationId);
  openDatabases.set(organizationId, database);
  return database;
};

export const deleteLocalDatabases = async () => {
  openDatabases.forEach((database) => database.close());
  openDatabases.clear();
  const names = await Dexie.getDatabaseNames();
  await Promise.all(
    names
      .filter((name) => name.startsWith(LOCAL_DATABASE_PREFIX))
      .map((name) => Dexie.delete(name)),
  );
};
