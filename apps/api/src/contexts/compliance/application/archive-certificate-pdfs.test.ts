import { err, ok } from "@passalio/shared";
import { pdfFingerprint, renderCertificate, signedCertificatePdfInput } from "@passalio/pdf";
import { beforeEach, describe, expect, it } from "vitest";
import type {
  ArchivedPdf,
  PdfArchiveDependencies,
  PendingPdfArchive,
} from "../domain/pdf-archive-ports";
import { certificateFonts } from "../../../platform/certificate-fonts";
import { createCertificatePdfRenderer } from "../infrastructure/certificate-pdf-renderer";
import {
  archiveCertificatePdfs,
  certificatePdfKey,
  PDF_ARCHIVE_BATCH_SIZE,
  PDF_ARCHIVE_MAX_ATTEMPTS,
} from "./archive-certificate-pdfs";
import { validBrandedCertificateData, validCertificateData } from "./certificate-data.fixture";

const FONTS = certificateFonts();

const NOW = new Date("2026-10-25T08:00:00.000Z");
const SIGNED_AT = new Date("2026-10-23T09:44:00.000Z");

const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const brandedData = () =>
  validBrandedCertificateData({
    technicianSignature: PIXEL,
    customerSignature: PIXEL,
    branding: { ...validBrandedCertificateData().branding, logo: null },
  });

const pendingDocument = (overrides: Partial<PendingPdfArchive> = {}): PendingPdfArchive => ({
  id: "document-1",
  organizationId: "organization-1",
  numberPrefix: "RD-",
  number: 142,
  signedAt: SIGNED_AT,
  data: brandedData(),
  ...overrides,
});

type ArchiveState = {
  pending: PendingPdfArchive[];
  archived: ArchivedPdf[];
  failed: string[];
  stored: Map<string, { bytes: Uint8Array; sha256: string }>;
  requested: { limit: number; maxAttempts: number }[];
};

let state: ArchiveState;

const dependenciesOf = (
  overrides: Partial<PdfArchiveDependencies> = {},
): PdfArchiveDependencies => ({
  archives: {
    pending: async (limit, maxAttempts) => {
      state.requested.push({ limit, maxAttempts });
      return state.pending.slice(0, limit);
    },
    markArchived: async (archived) => {
      state.archived.push(archived);
    },
    markFailed: async (_organizationId, documentId) => {
      state.failed.push(documentId);
    },
  },
  storage: {
    put: async (key, bytes, sha256) => {
      state.stored.set(key, { bytes, sha256 });
    },
  },
  render: createCertificatePdfRenderer(FONTS),
  now: () => NOW,
  ...overrides,
});

beforeEach(() => {
  state = { pending: [], archived: [], failed: [], stored: new Map(), requested: [] };
});

describe("archiveCertificatePdfs", () => {
  it("stores the PDF of a signed certificate on R2 with its SHA-256 fingerprint", async () => {
    state.pending.push(pendingDocument());

    const run = await archiveCertificatePdfs(dependenciesOf())();

    const key = certificatePdfKey("organization-1", "document-1");
    const stored = state.stored.get(key);
    expect(run).toStrictEqual({ archivedIds: ["document-1"], failures: [] });
    expect(key).toBe("organizations/organization-1/documents/document-1.pdf");
    expect(stored?.sha256).toBe(await pdfFingerprint(stored?.bytes ?? new Uint8Array()));
    expect(state.archived).toStrictEqual([
      {
        documentId: "document-1",
        organizationId: "organization-1",
        key,
        sha256: stored?.sha256,
        at: NOW,
      },
    ]);
  });

  it("archives the same file as the one rendered on the phone, byte for byte", async () => {
    state.pending.push(pendingDocument());

    await archiveCertificatePdfs(dependenciesOf())();

    const onPhone = await renderCertificate(
      signedCertificatePdfInput({
        numberPrefix: "RD-",
        number: 142,
        signedAt: SIGNED_AT.toISOString(),
        data: brandedData(),
      }),
      FONTS,
    );
    expect(onPhone.isOk).toBe(true);
    expect(state.archived[0]?.sha256).toBe(
      await pdfFingerprint(onPhone.isOk ? onPhone.value : new Uint8Array()),
    );
  });

  it("does not archive a version 1 certificate, which has no frozen branding", async () => {
    state.pending.push(pendingDocument({ data: validCertificateData() }));

    const run = await archiveCertificatePdfs(dependenciesOf())();

    expect(run.failures).toStrictEqual([
      { documentId: "document-1", reason: "unsupported_template" },
    ]);
    expect(state.failed).toStrictEqual(["document-1"]);
    expect(state.stored.size).toBe(0);
    expect(state.archived).toStrictEqual([]);
  });

  it("counts a failed attempt when the certificate cannot be rendered", async () => {
    state.pending.push(pendingDocument());

    const run = await archiveCertificatePdfs(
      dependenciesOf({ render: async () => err("unreadable_image") }),
    )();

    expect(run.failures).toStrictEqual([{ documentId: "document-1", reason: "unreadable_image" }]);
    expect(state.failed).toStrictEqual(["document-1"]);
    expect(state.archived).toStrictEqual([]);
  });

  it("does not record the archive when R2 refuses the file", async () => {
    state.pending.push(pendingDocument());

    const run = await archiveCertificatePdfs(
      dependenciesOf({
        storage: {
          put: async () => {
            throw new Error("r2_unavailable");
          },
        },
      }),
    )();

    expect(run.failures).toStrictEqual([{ documentId: "document-1", reason: "storage_failed" }]);
    expect(state.failed).toStrictEqual(["document-1"]);
    expect(state.archived).toStrictEqual([]);
  });

  it("keeps archiving the next certificates after a failure", async () => {
    state.pending.push(
      pendingDocument({ id: "document-1", data: validCertificateData() }),
      pendingDocument({ id: "document-2" }),
    );

    const run = await archiveCertificatePdfs(
      dependenciesOf({ render: async () => ok(new Uint8Array([37, 80, 68, 70])) }),
    )();

    expect(run.archivedIds).toStrictEqual(["document-2"]);
    expect(run.failures.map(({ documentId }) => documentId)).toStrictEqual(["document-1"]);
  });

  it("archives a small batch per run and gives up after a few failed attempts", async () => {
    await archiveCertificatePdfs(dependenciesOf())();

    expect(state.requested).toStrictEqual([
      { limit: PDF_ARCHIVE_BATCH_SIZE, maxAttempts: PDF_ARCHIVE_MAX_ATTEMPTS },
    ]);
    expect(PDF_ARCHIVE_BATCH_SIZE).toBe(5);
    expect(PDF_ARCHIVE_MAX_ATTEMPTS).toBe(3);
  });
});
