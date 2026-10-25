import { brandedChimneySweepingCertificate } from "@passalio/trades";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { DocumentRecord } from "@/lib/db/local-records";
import { renderSignedCertificate } from "@/lib/pdf/signed-certificate-pdf";
import { complianceFr } from "../fr";
import { numberOf } from "../signed-labels";

export type CertificatePdf =
  | { readonly status: "loading" }
  | { readonly status: "failed" }
  | { readonly status: "ready"; readonly file: File; readonly url: string };

const fileOf = async (document: DocumentRecord): Promise<File | null> => {
  const data = brandedChimneySweepingCertificate.safeParse(document.data);
  if (!data.success) {
    return null;
  }
  const rendered = await renderSignedCertificate({
    numberPrefix: document.numberPrefix,
    number: document.number,
    signedAt: document.signedAt,
    data: data.data,
  });
  return rendered.isOk
    ? new File([new Uint8Array(rendered.value)], complianceFr.signed.fileName(numberOf(document)), {
        type: "application/pdf",
      })
    : null;
};

const useObjectUrl = (file: File | null | undefined) => {
  const url = useMemo(
    () => (file === null || file === undefined ? null : URL.createObjectURL(file)),
    [file],
  );
  useEffect(
    () => () => {
      if (url !== null) {
        URL.revokeObjectURL(url);
      }
    },
    [url],
  );
  return url;
};

export const useCertificatePdf = (document: DocumentRecord): CertificatePdf => {
  const query = useQuery({
    queryKey: ["compliance", "certificate-pdf", document.id, document.updatedAt],
    queryFn: () => fileOf(document),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    networkMode: "always",
  });
  const url = useObjectUrl(query.data);
  if (query.isError || query.data === null) {
    return { status: "failed" };
  }
  return query.data === undefined || url === null
    ? { status: "loading" }
    : { status: "ready", file: query.data, url };
};
