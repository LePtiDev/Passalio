import { Link } from "@tanstack/react-router";
import { CircleAlert, Info } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PreviewState } from "../../hooks/use-certificate-preview";
import { settingsFr } from "../../settings-fr";

const text = settingsFr.documents;

const PAGE_CLASS = "aspect-[210/297] w-full rounded-md border border-[#E3E8EF] bg-white shadow-sm";

const TABS_LIST_CLASS =
  "grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-[#EAEFF4] p-1 group-data-[orientation=horizontal]/tabs:h-auto lg:w-fit";

const TAB_CLASS =
  "h-12 rounded-[9px] px-4 text-sm font-medium text-[#475569] data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#0F2A44] lg:h-8 lg:text-[13px]";

const PreviewPages = ({ pages }: { readonly pages: readonly string[] }) => {
  const labelled = pages.map((source, index) => ({
    id: `page-${index + 1}`,
    label: text.page(index + 1),
    source,
  }));
  const [page, setPage] = useState("page-1");
  return (
    <Tabs value={page} onValueChange={setPage} className="flex flex-col gap-3">
      <TabsList className={TABS_LIST_CLASS}>
        {labelled.map(({ id, label }) => (
          <TabsTrigger key={id} value={id} className={TAB_CLASS}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {labelled.map(({ id, label, source }) => (
        <TabsContent key={id} value={id}>
          <img src={source} alt={label} className={PAGE_CLASS} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

const PreviewSkeleton = () => (
  <div aria-busy="true" aria-label={text.previewLoading} className="flex flex-col gap-3">
    <Skeleton className="h-9 w-40" />
    <Skeleton className={PAGE_CLASS} />
  </div>
);

const PreviewError = () => (
  <p role="alert" className="flex items-start gap-2 text-sm text-destructive lg:text-[13px]">
    <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
    {text.previewFailed}
  </p>
);

const SampleCompanyNote = () => (
  <p className="flex items-start gap-2 rounded-lg bg-[#FFF7E6] p-3 text-[13px] text-[#7A4B00]">
    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
    <span>
      {text.previewMissingCompany}{" "}
      <Link to="/reglages/entreprise" className="font-semibold underline">
        {text.previewMissingCompanyLink}
      </Link>
      .
    </span>
  </p>
);

export const CertificatePreviewPanel = ({
  state,
  isSampleCompany,
}: {
  readonly state: PreviewState;
  readonly isSampleCompany: boolean;
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-0.5">
      <h2 className="text-[15px] font-bold lg:text-sm">{text.previewTitle}</h2>
      <p className="text-[13px] text-[#64748B]">
        {text.previewNote} {text.previewUpdated}
      </p>
    </div>
    {isSampleCompany ? <SampleCompanyNote /> : null}
    {state.status === "loading" ? <PreviewSkeleton /> : null}
    {state.status === "error" ? <PreviewError /> : null}
    {state.status === "ready" ? <PreviewPages pages={state.pages} /> : null}
  </div>
);
