import { Dexie, type EntityTable, type Table } from "dexie";
import type { CertificateDraftRecord, LocalSetting, NumberBlockRecord } from "./compliance-records";
import type {
  CustomerRecord,
  DocumentRecord,
  EquipmentRecord,
  InterventionRecord,
  MemberRecord,
  OutboxEntry,
  PendingPhoto,
  PhotoRecord,
  SiteRecord,
  SyncRejection,
  SyncStateEntry,
  ServiceRecord,
} from "./local-records";

export const LOCAL_DATABASE_PREFIX = "passalio-";

export class LocalDatabase extends Dexie {
  declare customers: EntityTable<CustomerRecord, "id">;
  declare sites: EntityTable<SiteRecord, "id">;
  declare equipments: EntityTable<EquipmentRecord, "id">;
  declare photos: EntityTable<PhotoRecord, "id">;
  declare interventions: EntityTable<InterventionRecord, "id">;
  declare documents: EntityTable<DocumentRecord, "id">;
  declare members: EntityTable<MemberRecord, "userId">;
  declare services: EntityTable<ServiceRecord, "id">;
  declare outbox: EntityTable<OutboxEntry, "seq">;
  declare pendingPhotos: EntityTable<PendingPhoto, "id">;
  declare rejections: EntityTable<SyncRejection, "id">;
  declare syncState: EntityTable<SyncStateEntry, "key">;
  declare numberBlocks: EntityTable<NumberBlockRecord, "id">;
  declare localSettings: Table<LocalSetting, LocalSetting["key"]>;
  declare certificateDrafts: EntityTable<CertificateDraftRecord, "id">;

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
    this.version(2).stores({
      interventions: "id, scheduledDate, siteId",
      documents: "id, interventionId, equipmentId",
      members: "userId",
    });
    this.version(3)
      .stores({ visitTypes: "type" })
      .upgrade((transaction) =>
        transaction
          .table("interventions")
          .toCollection()
          .modify((intervention: { visitTypes?: unknown }) => {
            intervention.visitTypes ??= [];
          }),
      );
    this.version(4)
      .stores({ visitTypes: null, services: "id" })
      .upgrade((transaction) =>
        transaction
          .table("interventions")
          .toCollection()
          .modify(
            (intervention: {
              technicianUserId: string;
              technicianUserIds?: unknown;
              serviceLines?: unknown;
            }) => {
              intervention.technicianUserIds ??= [intervention.technicianUserId];
              intervention.serviceLines ??= [];
            },
          ),
      );
    this.version(5).stores({
      documents: "id, interventionId, equipmentId, number",
      numberBlocks: "id, userId",
      localSettings: "key",
      certificateDrafts: "id, interventionId",
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
