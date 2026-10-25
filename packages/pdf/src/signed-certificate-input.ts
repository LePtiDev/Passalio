import { documentNumberLabel } from "@passalio/shared";
import type { BrandedChimneySweepingCertificate } from "@passalio/trades";
import type { CertificatePdfInput } from "./certificate-pdf-input";

export type SignedCertificateDocument = {
  readonly numberPrefix: string;
  readonly number: number;
  readonly signedAt: string;
  readonly data: BrandedChimneySweepingCertificate;
};

export const signedCertificatePdfInput = ({
  numberPrefix,
  number,
  signedAt,
  data,
}: SignedCertificateDocument): CertificatePdfInput => {
  const { branding, ...certificate } = data;
  return {
    certificate,
    branding,
    document: { number: documentNumberLabel(numberPrefix, number), signedAt },
  };
};
