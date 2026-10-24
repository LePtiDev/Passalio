import type { CustomerMutation } from "@passalio/shared";
import type { LocalDatabase } from "../db/local-database";
import type { OutboxEntry } from "../db/local-records";

export type RejectedEntry = {
  readonly entry: OutboxEntry;
  readonly error: string;
};

const removeLocalCreation = async (database: LocalDatabase, mutation: CustomerMutation) => {
  switch (mutation.type) {
    case "create_customer":
      return database.customers.delete(mutation.customerId);
    case "add_site":
      return database.sites.delete(mutation.siteId);
    case "add_equipment":
      return database.equipments.delete(mutation.equipmentId);
    default:
      return undefined;
  }
};

export const recordRejections = async (
  database: LocalDatabase,
  pushed: readonly OutboxEntry[],
  rejected: readonly RejectedEntry[],
) =>
  database.transaction(
    "rw",
    [
      database.outbox,
      database.rejections,
      database.customers,
      database.sites,
      database.equipments,
      database.syncState,
    ],
    async () => {
      await database.outbox.bulkDelete(
        pushed.flatMap(({ seq }) => (seq === undefined ? [] : [seq])),
      );
      if (rejected.length === 0) {
        return;
      }
      const at = new Date().toISOString();
      await database.rejections.bulkPut(
        rejected.map(({ entry, error }) => ({
          id: entry.id,
          description: entry.mutation.type,
          error,
          at,
        })),
      );
      await Promise.all(rejected.map(({ entry }) => removeLocalCreation(database, entry.mutation)));
      await database.syncState.delete("cursor");
    },
  );

export const forgetRejections = (database: LocalDatabase) => database.rejections.clear();
