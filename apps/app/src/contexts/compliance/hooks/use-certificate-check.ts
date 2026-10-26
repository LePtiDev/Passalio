import { useQuery } from "@tanstack/react-query";
import type { DocumentRecord } from "@/lib/db/local-records";
import { integrityOf } from "../certificate-integrity";
import type { CertificatePdf } from "./use-certificate-pdf";

const fingerprintOf = async (file: File) => {
  const [{ pdfFingerprint }, buffer] = await Promise.all([
    import("@passalio/pdf"),
    file.arrayBuffer(),
  ]);
  return pdfFingerprint(new Uint8Array(buffer));
};

const pagesOf = async (file: File) => {
  const [{ pdfPageImages }, buffer] = await Promise.all([
    import("@/lib/pdf/pdf-page-images"),
    file.arrayBuffer(),
  ]);
  return pdfPageImages(new Uint8Array(buffer));
};

const fileOf = (pdf: CertificatePdf) => (pdf.status === "ready" ? pdf.file : null);

export const useCertificateIntegrity = (pdf: CertificatePdf, document: DocumentRecord) => {
  const file = fileOf(pdf);
  const archived = document.pdfSha256;
  const query = useQuery({
    queryKey: ["compliance", "certificate-fingerprint", document.id, document.updatedAt],
    queryFn: () => (file === null ? null : fingerprintOf(file)),
    enabled: file !== null && archived !== null && archived !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: "always",
    retry: false,
  });
  return integrityOf(archived, query.data ?? undefined);
};

export type CertificatePages =
  | { readonly status: "loading" }
  | { readonly status: "failed" }
  | { readonly status: "ready"; readonly pages: readonly string[] };

export const useCertificatePages = (
  pdf: CertificatePdf,
  document: DocumentRecord,
): CertificatePages => {
  const file = fileOf(pdf);
  const query = useQuery({
    queryKey: ["compliance", "certificate-pages", document.id, document.updatedAt],
    queryFn: () => (file === null ? null : pagesOf(file)),
    enabled: file !== null,
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: "always",
    retry: false,
  });
  if (pdf.status === "failed" || query.isError) {
    return { status: "failed" };
  }
  return query.data === undefined || query.data === null
    ? { status: "loading" }
    : { status: "ready", pages: query.data };
};
