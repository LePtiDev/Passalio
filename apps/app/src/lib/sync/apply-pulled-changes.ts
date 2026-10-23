import type { LocalDatabase } from "../db/local-database";
import { pendingEntityIds } from "../db/outbox";
import type { PulledChanges } from "./sync-api";

type PulledRow = { readonly id: string; readonly deletedAt: string | null };

type SyncedTable<Row> = {
  readonly bulkPut: (rows: readonly Row[]) => Promise<unknown>;
  readonly bulkDelete: (ids: string[]) => Promise<void>;
};

const applyTo = async <Row extends PulledRow>(
  table: SyncedTable<Row>,
  rows: readonly Row[],
  pending: ReadonlySet<string>,
) => {
  const settled = rows.filter(({ id }) => !pending.has(id));
  await table.bulkPut(settled.filter(({ deletedAt }) => deletedAt === null));
  await table.bulkDelete(settled.filter(({ deletedAt }) => deletedAt !== null).map(({ id }) => id));
};

export const applyPulledChanges = async (database: LocalDatabase, pulled: PulledChanges) =>
  database.transaction(
    "rw",
    [
      database.customers,
      database.sites,
      database.equipments,
      database.photos,
      database.outbox,
      database.syncState,
    ],
    async () => {
      const pending = await pendingEntityIds(database);
      await applyTo(database.customers, pulled.changes.customers, pending);
      await applyTo(database.sites, pulled.changes.sites, pending);
      await applyTo(database.equipments, pulled.changes.equipments, pending);
      await applyTo(database.photos, pulled.changes.photos, pending);
      await database.syncState.put({ key: "cursor", value: pulled.cursor });
    },
  );
