import type { CertificatePreview } from "@passalio/pdf";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { logoForPdf } from "@/lib/pdf/logo-for-pdf";
import { renderPreviewPages } from "@/lib/pdf/preview-pages";
import { ORGANIZATION_LOGO_URL } from "./use-organization";

const PREVIEW_DELAY_MS = 400;

export type PreviewState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly pages: readonly string[] }
  | { readonly status: "error" };

export const usePdfLogo = (logoVersion: string | null) =>
  useQuery({
    queryKey: ["identity", "pdf-logo", logoVersion],
    enabled: logoVersion !== null,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const response = await fetch(`${ORGANIZATION_LOGO_URL}?v=${logoVersion ?? ""}`);
      if (!response.ok) {
        throw new Error("logo_unavailable");
      }
      return logoForPdf(await response.blob());
    },
  });

const renderedState = async (preview: CertificatePreview): Promise<PreviewState> => {
  try {
    return { status: "ready", pages: await renderPreviewPages(preview) };
  } catch {
    return { status: "error" };
  }
};

export const useCertificatePreview = (preview: CertificatePreview): PreviewState => {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      void renderedState(preview).then((rendered) => {
        if (isCurrent) {
          setState(rendered);
        }
        return rendered;
      });
    }, PREVIEW_DELAY_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [preview]);
  return state;
};
