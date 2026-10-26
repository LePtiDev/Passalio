import { documents, equipments } from "@passalio/db";
import { and, asc, eq, getTableColumns, gt, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { DocumentRepository } from "../domain/compliance-ports";
import type { PdfArchiveRepository } from "../domain/pdf-archive-ports";

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

const ownDocument = (organizationId: string, documentId: string) =>
  and(eq(documents.organizationId, organizationId), eq(documents.id, documentId));

export const createD1PdfArchiveRepository = (database: Database): PdfArchiveRepository => ({
  pending: async (limit, maxAttempts) =>
    database
      .select({
        id: documents.id,
        organizationId: documents.organizationId,
        numberPrefix: documents.numberPrefix,
        number: documents.number,
        signedAt: documents.signedAt,
        data: documents.data,
      })
      .from(documents)
      .where(
        and(
          isNull(documents.pdfArchivedAt),
          isNull(documents.deletedAt),
          lt(documents.pdfArchiveAttempts, maxAttempts),
        ),
      )
      .orderBy(asc(documents.pdfArchiveAttempts), asc(documents.signedAt))
      .limit(limit)
      .all(),
  markArchived: async ({ documentId, organizationId, key, sha256, at }) => {
    await database
      .update(documents)
      .set({ pdfKey: key, pdfSha256: sha256, pdfArchivedAt: at, updatedAt: at })
      .where(ownDocument(organizationId, documentId));
  },
  markFailed: async (organizationId, documentId) => {
    await database
      .update(documents)
      .set({ pdfArchiveAttempts: sql`${documents.pdfArchiveAttempts} + 1` })
      .where(ownDocument(organizationId, documentId));
  },
});
