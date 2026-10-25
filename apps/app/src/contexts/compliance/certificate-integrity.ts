export type CertificateIntegrity =
  | { readonly status: "checking" }
  | { readonly status: "archiving" }
  | { readonly status: "verified"; readonly fingerprint: string }
  | { readonly status: "mismatch"; readonly fingerprint: string };

export const shortFingerprint = (fingerprint: string) =>
  `${fingerprint.slice(0, 4)} ${fingerprint.slice(4, 8)}`;

export const integrityOf = (
  archived: string | null | undefined,
  rendered: string | undefined,
): CertificateIntegrity => {
  if (archived === null || archived === undefined) {
    return { status: "archiving" };
  }
  if (rendered === undefined) {
    return { status: "checking" };
  }
  return rendered === archived
    ? { status: "verified", fingerprint: archived }
    : { status: "mismatch", fingerprint: archived };
};
