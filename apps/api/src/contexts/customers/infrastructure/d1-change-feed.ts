import { customers, equipmentPhotos, equipments, sites } from "@passalio/db";
import { and, asc, eq, gt, or } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { Database } from "../../../platform/database";
import type { ChangeCursor, ChangeFeed } from "../domain/customer-ports";

type SyncedColumns = {
  readonly organizationId: SQLiteColumn;
  readonly updatedAt: SQLiteColumn;
  readonly id: SQLiteColumn;
};

const changedAfter = (
  columns: SyncedColumns,
  organizationId: string,
  after: ChangeCursor | undefined,
) =>
  and(
    eq(columns.organizationId, organizationId),
    after === undefined
      ? undefined
      : or(
          gt(columns.updatedAt, after.updatedAt),
          and(eq(columns.updatedAt, after.updatedAt), gt(columns.id, after.id)),
        ),
  );

const changeOrder = (columns: SyncedColumns) => [asc(columns.updatedAt), asc(columns.id)];

export const createD1ChangeFeed = (database: Database): ChangeFeed => ({
  customers: async (organizationId, after, limit) =>
    database
      .select()
      .from(customers)
      .where(changedAfter(customers, organizationId, after))
      .orderBy(...changeOrder(customers))
      .limit(limit)
      .all(),
  sites: async (organizationId, after, limit) =>
    database
      .select()
      .from(sites)
      .where(changedAfter(sites, organizationId, after))
      .orderBy(...changeOrder(sites))
      .limit(limit)
      .all(),
  equipments: async (organizationId, after, limit) =>
    database
      .select()
      .from(equipments)
      .where(changedAfter(equipments, organizationId, after))
      .orderBy(...changeOrder(equipments))
      .limit(limit)
      .all(),
  photos: async (organizationId, after, limit) =>
    database
      .select()
      .from(equipmentPhotos)
      .where(changedAfter(equipmentPhotos, organizationId, after))
      .orderBy(...changeOrder(equipmentPhotos))
      .limit(limit)
      .all(),
});
