import { useCallback } from "react";
import { toast } from "sonner";
import { complianceFr } from "../fr";
import type { CertificatePdf } from "./use-certificate-pdf";

export const useSharePdf = (pdf: CertificatePdf) =>
  useCallback(() => {
    if (pdf.status !== "ready") {
      return;
    }
    const data = { files: [pdf.file], title: pdf.file.name };
    if (typeof navigator.canShare !== "function" || !navigator.canShare(data)) {
      toast.error(complianceFr.signed.shareUnavailable);
      return;
    }
    navigator.share(data).catch(() => undefined);
  }, [pdf]);
