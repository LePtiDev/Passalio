import type { ChangeCursor, ChangeFeed, Tombstoned } from "../domain/customer-ports";
import type { InMemoryCustomerState } from "./in-memory-customer-dependencies";

type SyncedRow = { readonly id: string; readonly organizationId: string; readonly updatedAt: Date };

const isAfter = (row: SyncedRow, after: ChangeCursor | undefined) =>
  after === undefined ||
  row.updatedAt > after.updatedAt ||
  (row.updatedAt.getTime() === after.updatedAt.getTime() && row.id > after.id);

export const createInMemoryChangeFeed = (state: InMemoryCustomerState): ChangeFeed => {
  const changesOf =
    <T extends SyncedRow>(rows: readonly T[]) =>
    async (organizationId: string, after: ChangeCursor | undefined, limit: number) =>
      rows
        .filter((row) => row.organizationId === organizationId)
        .map((row): Tombstoned<T> => {
          const archivedAt = state.archivedAt.get(row.id);
          return archivedAt === undefined
            ? { ...row, deletedAt: null }
            : { ...row, updatedAt: archivedAt, deletedAt: archivedAt };
        })
        .filter((row) => isAfter(row, after))
        .toSorted(
          (left, right) =>
            left.updatedAt.getTime() - right.updatedAt.getTime() || left.id.localeCompare(right.id),
        )
        .slice(0, limit);
  return {
    customers: async (...args) => changesOf(state.customers)(...args),
    sites: async (...args) => changesOf(state.sites)(...args),
    equipments: async (...args) => changesOf(state.equipments)(...args),
    photos: async (...args) => changesOf(state.photos)(...args),
  };
};
