import type { SignedCertificateDocument } from "@passalio/pdf";
import { certificateFonts } from "./certificate-fonts";

export const renderSignedCertificate = async (document: SignedCertificateDocument) => {
  const [{ renderCertificate, signedCertificatePdfInput }, fonts] = await Promise.all([
    import("@passalio/pdf"),
    certificateFonts(),
  ]);
  return renderCertificate(signedCertificatePdfInput(document), fonts);
};
