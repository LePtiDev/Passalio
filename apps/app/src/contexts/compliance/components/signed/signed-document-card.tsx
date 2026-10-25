import { Download, Eye, Share } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CARD_CLASS } from "@/contexts/customers";
import type { DocumentRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { complianceFr } from "../../fr";
import { useCertificatePdf, type CertificatePdf } from "../../hooks/use-certificate-pdf";
import { useSharePdf } from "../../hooks/use-share-pdf";
import { numberOf } from "../../signed-labels";

const text = complianceFr.signed;

const TILE_CLASS =
  "flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-[12px] border border-[#E3E8EF] bg-white text-[15px] font-semibold lg:h-14 lg:rounded-lg lg:text-[13px] aria-disabled:pointer-events-none aria-disabled:text-[#94A3B8]";

const isAdviceAttached = (document: DocumentRecord) => document.data["isAdviceAttached"] === true;

const PdfThumbnail = ({ label }: { readonly label: string }) => (
  <span
    aria-hidden="true"
    className="flex h-[88px] w-[66px] shrink-0 flex-col gap-1.5 rounded-md border border-[#E3E8EF] bg-white p-2 shadow-[0_1px_2px_rgba(15,42,68,0.08)]"
  >
    <span className="h-1.5 w-3/4 rounded-full bg-[#0F2A44]" />
    <span className="h-1 w-full rounded-full bg-[#E3E8EF]" />
    <span className="h-1 w-5/6 rounded-full bg-[#E3E8EF]" />
    <span className="h-1 w-full rounded-full bg-[#E3E8EF]" />
    <span className="mt-auto text-right text-[9px] font-bold text-[#0E7C5A]">{label}</span>
  </span>
);

const TileContent = ({
  icon: Icon,
  label,
}: {
  readonly icon: typeof Eye;
  readonly label: string;
}) => (
  <>
    <Icon aria-hidden="true" className="size-5 text-[#0E7C5A] lg:size-4" />
    {label}
  </>
);

const PdfActions = ({ pdf }: { readonly pdf: CertificatePdf }) => {
  const share = useSharePdf(pdf);
  if (pdf.status === "loading") {
    return (
      <div aria-busy="true" className="grid grid-cols-3 gap-2 lg:gap-3">
        {["share", "view", "download"].map((key) => (
          <Skeleton key={key} className="h-16 rounded-[12px] lg:h-14 lg:rounded-lg" />
        ))}
      </div>
    );
  }
  if (pdf.status === "failed") {
    return (
      <p role="alert" className="text-sm text-destructive lg:text-[13px]">
        {text.pdfFailed}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-3">
      <button type="button" onClick={share} className={TILE_CLASS}>
        <TileContent icon={Share} label={text.share} />
      </button>
      <a href={pdf.url} target="_blank" rel="noreferrer" className={TILE_CLASS}>
        <TileContent icon={Eye} label={text.view} />
      </a>
      <a href={pdf.url} download={pdf.file.name} className={TILE_CLASS}>
        <TileContent icon={Download} label={text.download} />
      </a>
    </div>
  );
};

export const SignedDocumentCard = ({
  document,
  isPending,
}: {
  readonly document: DocumentRecord;
  readonly isPending: boolean;
}) => {
  const pdf = useCertificatePdf(document);
  const number = numberOf(document);
  const hasAdvice = isAdviceAttached(document);
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className={cn(CARD_CLASS, "flex items-center gap-4 p-4")}>
        <PdfThumbnail label={number.slice(-4)} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[15px] font-semibold break-all lg:text-sm">
            {text.fileName(number)}
          </span>
          <span className="text-[13px] text-[#64748B]">
            {`${text.pages(hasAdvice ? 2 : 1)} · ${hasAdvice ? text.withAdvice : text.alone}`}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-[13px] font-medium",
              isPending ? "text-[#B45309]" : "text-[#0E7C5A]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", isPending ? "bg-[#D97706]" : "bg-[#0E7C5A]")}
            />
            {isPending ? text.pending : text.synced}
          </span>
        </span>
      </div>
      <PdfActions pdf={pdf} />
    </div>
  );
};
