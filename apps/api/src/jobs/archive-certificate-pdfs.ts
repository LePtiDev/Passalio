import {
  archiveCertificatePdfs,
  createCertificatePdfRenderer,
  createD1PdfArchiveRepository,
  createR2PdfStorage,
} from "../contexts/compliance";
import type { Bindings } from "../env";
import { certificateFonts } from "../platform/certificate-fonts";
import { createDatabase } from "../platform/database";
import { createLogger } from "../platform/logger";
import { newTraceId } from "../platform/trace";

export const archiveSignedCertificatePdfs = async (env: Bindings) => {
  const logger = createLogger(newTraceId());
  const run = await archiveCertificatePdfs({
    archives: createD1PdfArchiveRepository(createDatabase(env.DB)),
    storage: createR2PdfStorage(env.FILES),
    render: createCertificatePdfRenderer(certificateFonts()),
    now: () => new Date(),
  })();
  const fields = {
    event: "certificate_pdfs_archived",
    archived: run.archivedIds.length,
    failures: run.failures,
  };
  if (run.failures.length > 0) {
    logger.error(fields);
  } else {
    logger.info(fields);
  }
  return run;
};
