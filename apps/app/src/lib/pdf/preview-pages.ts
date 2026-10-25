import type { CertificatePreview } from "@passalio/pdf";
import { certificateFonts } from "./certificate-fonts";

export const renderPreviewPages = async (
  preview: CertificatePreview,
): Promise<readonly string[]> => {
  const [{ previewCertificateInput, renderCertificate }, { pdfPageImages }, fonts] =
    await Promise.all([import("@passalio/pdf"), import("./pdf-page-images"), certificateFonts()]);
  const rendered = await renderCertificate(previewCertificateInput(preview), fonts);
  if (!rendered.isOk) {
    throw new Error(rendered.error);
  }
  return pdfPageImages(rendered.value);
};
