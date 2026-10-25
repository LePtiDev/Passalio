import type { CertificateCompany } from "@passalio/trades";
import { sampleInput } from "./certificate-pdf-fixture";
import type { CertificatePdfInput, DocumentBranding } from "./certificate-pdf-input";

export type CertificatePreview = {
  readonly company: Partial<CertificateCompany>;
  readonly branding: DocumentBranding;
  readonly number: string;
};

export const previewCertificateInput = ({
  company,
  branding,
  number,
}: CertificatePreview): CertificatePdfInput => {
  const sample = sampleInput({ branding });
  return {
    ...sample,
    certificate: { ...sample.certificate, company: { ...sample.certificate.company, ...company } },
    document: { ...sample.document, number },
  };
};
