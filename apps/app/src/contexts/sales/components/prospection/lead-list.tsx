import type { ProspectCompanySummaryResponse } from "@passalio/shared";
import { useCallback, type ReactNode } from "react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { departmentName } from "../../department-names";
import { salesFr } from "../../fr";
import { MUTED_CLASS } from "../sales-styles";
import { ScreenReaderText } from "../screen-reader-text";

const text = salesFr.prospection;

export const LEADS_CARD_CLASS =
  "overflow-hidden rounded-xl border border-[#E3E8EF] bg-white text-[13px]";

type LeadRowProps = {
  readonly company: ProspectCompanySummaryResponse;
  readonly isSelected: boolean;
  readonly onSelect: (companyId: string) => void;
};

const LeadRow = ({ company, isSelected, onSelect }: LeadRowProps) => {
  const select = useCallback(() => onSelect(company.id), [company.id, onSelect]);
  return (
    <li className="border-b border-[#EEF2F6] last:border-b-0">
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={select}
        className={cn(
          "flex w-full items-center gap-3 px-3.5 py-2.5 text-left",
          isSelected
            ? "bg-[#F7F9FB] shadow-[inset_2px_0_0_#0F2A44]"
            : "bg-white hover:bg-[#F7F9FB]",
        )}
      >
        <InitialsAvatar name={company.name} tone="amber" size="small" />
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate font-semibold">
            <ScreenReaderText>{text.selectBefore}</ScreenReaderText>
            {company.name}
            <ScreenReaderText>{text.selectAfter}</ScreenReaderText>
          </span>
          <span aria-hidden="true" className="truncate text-[#64748B]">
            {company.city ?? departmentName(company.department)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "whitespace-nowrap tabular-nums",
            company.phone === null ? MUTED_CLASS : "text-[#475569]",
          )}
        >
          {company.phone ?? salesFr.list.noPhone}
        </span>
      </button>
    </li>
  );
};

type LeadListProps = {
  readonly companies: readonly ProspectCompanySummaryResponse[];
  readonly selectedId: string | null;
  readonly onSelect: (companyId: string) => void;
  readonly children: ReactNode;
};

export const LeadList = ({ companies, selectedId, onSelect, children }: LeadListProps) => (
  <div className={LEADS_CARD_CLASS}>
    <ul aria-label={text.leadsLabel}>
      {companies.map((company) => (
        <LeadRow
          key={company.id}
          company={company}
          isSelected={company.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
    {children}
  </div>
);

const SKELETON_ROWS = [
  { key: "a", width: "w-40" },
  { key: "b", width: "w-20" },
  { key: "c", width: "w-44" },
  { key: "d", width: "w-48" },
  { key: "e", width: "w-36" },
  { key: "f", width: "w-28" },
  { key: "g", width: "w-40" },
  { key: "h", width: "w-32" },
  { key: "i", width: "w-24" },
];

export const LeadListSkeleton = () => (
  <ul aria-busy="true" className={LEADS_CARD_CLASS}>
    {SKELETON_ROWS.map(({ key, width }) => (
      <li
        key={key}
        className="flex items-center gap-3 border-b border-[#EEF2F6] px-3.5 py-2.5 last:border-b-0"
      >
        <Skeleton className="size-7 rounded-full" />
        <span className="flex flex-1 flex-col gap-1.5 py-0.5">
          <Skeleton className={`h-3 ${width}`} />
          <Skeleton className="h-2.5 w-24" />
        </span>
        <Skeleton className="h-3 w-20" />
      </li>
    ))}
  </ul>
);
