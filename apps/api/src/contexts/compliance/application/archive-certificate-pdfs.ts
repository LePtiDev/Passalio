import { err, ok, type Result } from "@passalio/shared";
import { pdfFingerprint, type CertificatePdfError } from "@passalio/pdf";
import { brandedChimneySweepingCertificate } from "@passalio/trades";
import type { PdfArchiveDependencies, PendingPdfArchive } from "../domain/pdf-archive-ports";

export const PDF_ARCHIVE_BATCH_SIZE = 5;
export const PDF_ARCHIVE_MAX_ATTEMPTS = 3;

export type PdfArchiveFailure = {
  readonly documentId: string;
  readonly reason: CertificatePdfError | "unsupported_template" | "storage_failed";
};

export type PdfArchiveRun = {
  readonly archivedIds: readonly string[];
  readonly failures: readonly PdfArchiveFailure[];
};

export const certificatePdfKey = (organizationId: string, documentId: string) =>
  `organizations/${organizationId}/documents/${documentId}.pdf`;

const renderPending = async (
  { render }: Pick<PdfArchiveDependencies, "render">,
  document: PendingPdfArchive,
): Promise<Result<Uint8Array, PdfArchiveFailure["reason"]>> => {
  const data = brandedChimneySweepingCertificate.safeParse(document.data);
  if (!data.success) {
    return err("unsupported_template");
  }
  return render({
    numberPrefix: document.numberPrefix,
    number: document.number,
    signedAt: document.signedAt.toISOString(),
    data: data.data,
  });
};

const store = async (
  { storage }: Pick<PdfArchiveDependencies, "storage">,
  key: string,
  bytes: Uint8Array,
  sha256: string,
): Promise<Result<void, "storage_failed">> => {
  try {
    await storage.put(key, bytes, sha256);
    return ok(undefined);
  } catch {
    return err("storage_failed");
  }
};

const archiveOne = async (
  dependencies: PdfArchiveDependencies,
  document: PendingPdfArchive,
): Promise<Result<void, PdfArchiveFailure["reason"]>> => {
  const rendered = await renderPending(dependencies, document);
  if (!rendered.isOk) {
    return rendered;
  }
  const sha256 = await pdfFingerprint(rendered.value);
  const key = certificatePdfKey(document.organizationId, document.id);
  const stored = await store(dependencies, key, rendered.value, sha256);
  if (!stored.isOk) {
    return stored;
  }
  await dependencies.archives.markArchived({
    documentId: document.id,
    organizationId: document.organizationId,
    key,
    sha256,
    at: dependencies.now(),
  });
  return ok(undefined);
};

const archiveOrCount = async (
  dependencies: PdfArchiveDependencies,
  document: PendingPdfArchive,
): Promise<PdfArchiveFailure | null> => {
  const archived = await archiveOne(dependencies, document);
  if (archived.isOk) {
    return null;
  }
  await dependencies.archives.markFailed(document.organizationId, document.id);
  return { documentId: document.id, reason: archived.error };
};

export const archiveCertificatePdfs =
  (dependencies: PdfArchiveDependencies) => async (): Promise<PdfArchiveRun> => {
    const pending = await dependencies.archives.pending(
      PDF_ARCHIVE_BATCH_SIZE,
      PDF_ARCHIVE_MAX_ATTEMPTS,
    );
    const outcomes = await pending.reduce<Promise<readonly (PdfArchiveFailure | null)[]>>(
      async (previous, document) => [
        ...(await previous),
        await archiveOrCount(dependencies, document),
      ],
      Promise.resolve([]),
    );
    return {
      archivedIds: pending.filter((_, index) => outcomes[index] === null).map(({ id }) => id),
      failures: outcomes.filter((outcome) => outcome !== null),
    };
  };
