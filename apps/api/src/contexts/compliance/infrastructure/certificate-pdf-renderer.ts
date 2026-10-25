import { renderCertificate, signedCertificatePdfInput, type CertificateFonts } from "@passalio/pdf";
import type { CertificatePdfRenderer } from "../domain/pdf-archive-ports";

export const createCertificatePdfRenderer =
  (fonts: CertificateFonts): CertificatePdfRenderer =>
  (document) =>
    renderCertificate(signedCertificatePdfInput(document), fonts);
