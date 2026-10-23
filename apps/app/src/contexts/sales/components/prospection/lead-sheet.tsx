import type { ProspectCompanyFileResponse } from "@passalio/shared";
import { useCallback, type ReactNode } from "react";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { salesFr } from "../../fr";
import { useCompanyFile } from "../../hooks/use-sales-queries";
import { callablePhoneOf, leaderNameOf, townOf } from "../file/company-facts";
import { CompanyLink } from "../record-links";
import { LeadStageButtons } from "./lead-stage-buttons";

const text = salesFr.prospection;

export const SheetFrame = ({
  isBusy = false,
  children,
}: {
  readonly isBusy?: boolean;
  readonly children: ReactNode;
}) => (
  <section
    aria-label={text.selectedLabel}
    aria-busy={isBusy}
    className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 rounded-t-2xl bg-white px-4 pt-2 pb-4 shadow-[0_-4px_20px_rgba(15,42,68,0.12)] lg:hidden"
  >
    <span aria-hidden="true" className="h-1 w-9 self-center rounded-full bg-[#CBD5E1]" />
    {children}
  </section>
);

const LeadSummary = ({
  file,
  onChanged,
}: {
  readonly file: ProspectCompanyFileResponse;
  readonly onChanged: (companyId: string) => void;
}) => {
  const line = [leaderNameOf(file), townOf(file), callablePhoneOf(file)]
    .filter((part) => part !== null)
    .join(" · ");
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <CompanyLink id={file.company.id} className="text-[17px] font-bold">
          {file.company.name}
        </CompanyLink>
        <span className="text-[13px] text-[#64748B]">{line}</span>
      </div>
      <LeadStageButtons company={file.company} onChanged={onChanged} />
      <CompanyLink
        id={file.company.id}
        className="flex h-12 items-center justify-center rounded-[10px] bg-[#0F2A44] text-[15px] font-semibold text-white"
      >
        {text.openFile}
      </CompanyLink>
    </>
  );
};

export const LeadSheetSkeleton = () => (
  <SheetFrame isBusy>
    <div className="flex flex-col gap-2 py-1">
      <Skeleton className="h-4 w-52" />
      <Skeleton className="h-3 w-64" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Skeleton className="h-12 rounded-[10px]" />
      <Skeleton className="h-12 rounded-[10px]" />
    </div>
    <Skeleton className="h-12 rounded-[10px]" />
  </SheetFrame>
);

type LeadSheetProps = {
  readonly companyId: string;
  readonly onChanged: (companyId: string) => void;
};

export const LeadSheet = ({ companyId, onChanged }: LeadSheetProps) => {
  const file = useCompanyFile(companyId);
  const { refetch } = file;
  const retry = useCallback(() => void refetch(), [refetch]);
  if (file.isPending) {
    return <LeadSheetSkeleton />;
  }
  return (
    <SheetFrame>
      {file.isError ? (
        <ErrorState error={file.error} onRetry={retry} />
      ) : (
        <LeadSummary file={file.data} onChanged={onChanged} />
      )}
    </SheetFrame>
  );
};
