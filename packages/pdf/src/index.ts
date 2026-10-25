import { PDFDocument } from "pdf-lib";

export const createEmptyPdf = async (): Promise<Uint8Array> => {
  const document = await PDFDocument.create();
  document.addPage();
  return document.save();
};

export {
  certificateContent,
  type CertificateContent,
  type CertificatePdfError,
} from "./certificate-content";
export {
  BRANDING_TEXT_MAX_LENGTH,
  certificatePdfInput,
  DOCUMENT_TEMPLATES,
  documentBranding,
  LOGO_FORMATS,
  type CertificatePdfInput,
  type DocumentBranding,
  type DocumentTemplate,
} from "./certificate-pdf-input";
export { pdfFingerprint } from "./pdf-fingerprint";
export { renderCertificate, type CertificateFonts } from "./render-certificate";
export { previewCertificateInput, type CertificatePreview } from "./certificate-preview";
