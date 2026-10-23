import type { ProspectCompanyFileResponse } from "@passalio/shared";
import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { useCompanyFile } from "../../hooks/use-sales-queries";
import { callablePhoneOf, leaderNameOf, townOf } from "../file/company-facts";
import { CompanyLink } from "../record-links";
import { MUTED_CLASS } from "../sales-styles";
import { LeadStageButtons } from "./lead-stage-buttons";
import { webAddressOf } from "./prospection-scope";

const text = salesFr.prospection;

const CARD_CLASS =
  "absolute top-4 left-4 z-10 hidden w-[300px] overflow-hidden rounded-xl border border-[#E3E8EF] bg-white text-[13px] shadow-[0_8px_24px_rgba(15,42,68,0.12)] lg:block";

const ROW_CLASS = "flex justify-between gap-3 border-t border-[#EEF2F6] px-3.5 py-2";

const factsOf = (file: ProspectCompanyFileResponse) => {
  const { company } = file;
  return [
    { label: text.leader, value: leaderNameOf(file), missing: text.missingLeader },
    { label: text.phone, value: callablePhoneOf(file), missing: text.missingPhone },
    { label: text.activity, value: company.activity, missing: text.missingActivity },
    {
      label: text.website,
      value: company.website === null ? null : webAddressOf(company.website),
      missing: text.missingWebsite,
    },
  ];
};

const LeadFile = ({
  file,
  onChanged,
}: {
  readonly file: ProspectCompanyFileResponse;
  readonly onChanged: (companyId: string) => void;
}) => (
  <>
    <div className="flex flex-col gap-0.5 px-3.5 pt-3.5 pb-2.5">
      <strong className="text-sm leading-[1.26]">{file.company.name}</strong>
      <span className="text-[#64748B]">{townOf(file)}</span>
    </div>
    <dl>
      {factsOf(file).map(({ label, value, missing }) => (
        <div key={label} className={ROW_CLASS}>
          <dt className="text-[#64748B]">{label}</dt>
          <dd className={cn("truncate text-right", value === null && MUTED_CLASS)}>
            {value ?? missing}
          </dd>
        </div>
      ))}
    </dl>
    <div className="flex flex-col gap-2 border-t border-[#EEF2F6] px-3.5 py-3">
      <LeadStageButtons company={file.company} onChanged={onChanged} />
      <CompanyLink
        id={file.company.id}
        className="inline-flex h-8 items-center font-semibold text-[#0E7C5A] hover:text-[#0F2A44]"
      >
        {text.openFile}
      </CompanyLink>
    </div>
  </>
);

const FACT_SKELETONS = ["leader", "phone", "activity", "website"];

export const LeadCardSkeleton = () => (
  <div aria-busy="true" className={CARD_CLASS}>
    <div className="flex flex-col gap-2 px-3.5 pt-4 pb-3">
      <Skeleton className="h-3.5 w-44" />
      <Skeleton className="h-3 w-28" />
    </div>
    {FACT_SKELETONS.map((key) => (
      <div key={key} className={ROW_CLASS}>
        <Skeleton className="my-0.5 h-3 w-16" />
        <Skeleton className="my-0.5 h-3 w-24" />
      </div>
    ))}
    <div className="flex flex-col gap-2 border-t border-[#EEF2F6] px-3.5 py-3">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-8 rounded-[7px]" />
        <Skeleton className="h-8 rounded-[7px]" />
      </div>
      <Skeleton className="my-2.5 h-3 w-24" />
    </div>
  </div>
);

type LeadCardProps = {
  readonly companyId: string;
  readonly onChanged: (companyId: string) => void;
};

export const LeadCard = ({ companyId, onChanged }: LeadCardProps) => {
  const file = useCompanyFile(companyId);
  const { refetch } = file;
  const retry = useCallback(() => void refetch(), [refetch]);
  if (file.isPending) {
    return <LeadCardSkeleton />;
  }
  return (
    <section aria-label={text.selectedLabel} className={CARD_CLASS}>
      {file.isError ? (
        <ErrorState error={file.error} onRetry={retry} />
      ) : (
        <LeadFile file={file.data} onChanged={onChanged} />
      )}
    </section>
  );
};
