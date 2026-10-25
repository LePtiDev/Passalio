import { CircleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { documentFr } from "../../document-fr";
import type { CertificatePages as Pages } from "../../hooks/use-certificate-check";

const PAGE_CLASS =
  "mx-auto aspect-[210/297] w-full max-w-[640px] rounded-[4px] border border-[#E3E8EF] bg-white shadow-[0_2px_8px_rgba(15,42,68,0.08)]";

export const CertificatePages = ({ pages }: { readonly pages: Pages }) => {
  if (pages.status === "failed") {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive lg:text-[13px]">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {documentFr.pagesFailed}
      </p>
    );
  }
  if (pages.status === "loading") {
    return (
      <div aria-busy="true" aria-label={documentFr.pagesLoading}>
        <Skeleton className={PAGE_CLASS} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {pages.pages.map((source, index) => (
        <img key={source} src={source} alt={documentFr.page(index + 1)} className={PAGE_CLASS} />
      ))}
    </div>
  );
};
