import { documents, equipments } from "@passalio/db";
import { and, asc, eq, getTableColumns, gt, isNull, or, type SQL } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { DocumentRepository } from "../domain/compliance-ports";

const { deletedAt: _deletedAt, ...DOCUMENT_COLUMNS } = getTableColumns(documents);

const changedAfter = (after: { readonly updatedAt: Date; readonly id: string } | undefined) =>
  after === undefined
    ? undefined
    : or(
        gt(documents.updatedAt, after.updatedAt),
        and(eq(documents.updatedAt, after.updatedAt), gt(documents.id, after.id)),
      );

export const createD1DocumentRepository = (database: Database): DocumentRepository => {
  const changesWhere = (condition: SQL | undefined, limit: number) =>
    database
      .select()
      .from(documents)
      .where(condition)
      .orderBy(asc(documents.updatedAt), asc(documents.id))
      .limit(limit)
      .all();
  return {
    exists: async (id) =>
      (await database
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, id))
        .get()) !== undefined,
    findById: async (organizationId, documentId) =>
      database
        .select(DOCUMENT_COLUMNS)
        .from(documents)
        .where(
          and(
            eq(documents.organizationId, organizationId),
            eq(documents.id, documentId),
            isNull(documents.deletedAt),
          ),
        )
        .get(),
    isNumberTaken: async (organizationId, number) =>
      (await database
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.organizationId, organizationId), eq(documents.number, number)))
        .get()) !== undefined,
    isCancelled: async (organizationId, documentId) =>
      (await database
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.organizationId, organizationId),
            eq(documents.cancelsDocumentId, documentId),
          ),
        )
        .get()) !== undefined,
    sign: async (document, { equipmentId, ...sweeping }) => {
      await database.batch([
        database.insert(documents).values({ ...document, data: { ...document.data } }),
        database
          .update(equipments)
          .set(sweeping)
          .where(
            and(
              eq(equipments.organizationId, document.organizationId),
              eq(equipments.id, equipmentId),
            ),
          ),
      ]);
    },
    changesAfter: async (organizationId, after, limit) =>
      changesWhere(and(eq(documents.organizationId, organizationId), changedAfter(after)), limit),
    changesSignedBy: (userId) => async (organizationId, after, limit) =>
      changesWhere(
        and(
          eq(documents.organizationId, organizationId),
          eq(documents.signedByUserId, userId),
          changedAfter(after),
        ),
        limit,
      ),
  };
};
