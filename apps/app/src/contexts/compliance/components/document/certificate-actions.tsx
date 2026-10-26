import { Download, Ellipsis, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { documentFr } from "../../document-fr";
import type { CertificatePdf } from "../../hooks/use-certificate-pdf";
import { useSharePdf } from "../../hooks/use-share-pdf";

export const DesktopCertificateActions = ({ pdf }: { readonly pdf: CertificatePdf }) =>
  pdf.status === "ready" ? (
    <Button asChild variant="secondary">
      <a href={pdf.url} download={pdf.file.name}>
        <Download aria-hidden="true" />
        {documentFr.download}
      </a>
    </Button>
  ) : (
    <Button variant="secondary" disabled>
      <Download aria-hidden="true" />
      {documentFr.download}
    </Button>
  );

export const MobileCertificateActions = ({ pdf }: { readonly pdf: CertificatePdf }) => {
  const share = useSharePdf(pdf);
  const isReady = pdf.status === "ready";
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-[#E3E8EF] bg-white px-4 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={!isReady}>
          <Button variant="secondary" size="icon" aria-label={documentFr.more}>
            <Ellipsis aria-hidden="true" className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top">
          {isReady && (
            <DropdownMenuItem asChild className="min-h-12 text-[15px]">
              <a href={pdf.url} download={pdf.file.name}>
                <Download aria-hidden="true" />
                {documentFr.download}
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button className="flex-1" onClick={share} disabled={!isReady}>
        <Share aria-hidden="true" className="size-5" />
        {documentFr.share}
      </Button>
    </div>
  );
};
