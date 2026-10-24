import { LocalDatabase, localDatabaseOf } from "@/lib/db/local-database";
import type {
  CustomerRecord,
  EquipmentRecord,
  PhotoRecord,
  SiteRecord,
} from "@/lib/db/local-records";

type LocalRecords = {
  readonly customers?: readonly CustomerRecord[];
  readonly sites?: readonly SiteRecord[];
  readonly equipments?: readonly EquipmentRecord[];
  readonly photos?: readonly PhotoRecord[];
  readonly lastSyncedAt?: string;
};

export const newOrganizationId = () => `organization-${crypto.randomUUID()}`;

export const seedLocalDatabase = async (organizationId: string, records: LocalRecords) => {
  const database = new LocalDatabase(organizationId);
  await database.customers.bulkPut([...(records.customers ?? [])]);
  await database.sites.bulkPut([...(records.sites ?? [])]);
  await database.equipments.bulkPut([...(records.equipments ?? [])]);
  await database.photos.bulkPut([...(records.photos ?? [])]);
  if (records.lastSyncedAt !== undefined) {
    await database.syncState.put({ key: "lastSyncedAt", value: records.lastSyncedAt });
  }
  database.close();
  return localDatabaseOf(organizationId);
};

export const outboxTypes = async (organizationId: string) =>
  (await localDatabaseOf(organizationId).outbox.orderBy("seq").toArray()).map(
    ({ mutation }) => mutation.type,
  );
