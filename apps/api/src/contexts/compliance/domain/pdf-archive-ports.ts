import type { Result } from "@passalio/shared";
import type { CertificatePdfError, SignedCertificateDocument } from "@passalio/pdf";

export type PendingPdfArchive = {
  readonly id: string;
  readonly organizationId: string;
  readonly numberPrefix: string;
  readonly number: number;
  readonly signedAt: Date;
  readonly data: Readonly<Record<string, unknown>>;
};

export type ArchivedPdf = {
  readonly documentId: string;
  readonly organizationId: string;
  readonly key: string;
  readonly sha256: string;
  readonly at: Date;
};

export type PdfArchiveRepository = {
  readonly pending: (limit: number, maxAttempts: number) => Promise<readonly PendingPdfArchive[]>;
  readonly markArchived: (archived: ArchivedPdf) => Promise<void>;
  readonly markFailed: (organizationId: string, documentId: string) => Promise<void>;
};

export type PdfStorage = {
  readonly put: (key: string, bytes: Uint8Array, sha256: string) => Promise<void>;
};

export type CertificatePdfRenderer = (
  document: SignedCertificateDocument,
) => Promise<Result<Uint8Array, CertificatePdfError>>;

export type PdfArchiveDependencies = {
  readonly archives: PdfArchiveRepository;
  readonly storage: PdfStorage;
  readonly render: CertificatePdfRenderer;
  readonly now: () => Date;
};
