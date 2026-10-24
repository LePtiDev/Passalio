import type { ProspectCompanySummaryResponse } from "@passalio/shared";
import { ChevronRight } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { CompanyLink } from "../record-links";
import { ScreenReaderText } from "../screen-reader-text";
import { LIST_ROW_CLASS, MUTED_CLASS, NEUTRAL_BADGE_CLASS } from "../sales-styles";
import { StageLabel } from "../stage-label";

const text = salesFr.list;

export const COMPANY_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_150px_110px_24px] lg:gap-4";

export const CompanyRow = ({ company }: { readonly company: ProspectCompanySummaryResponse }) => (
  <li className="border-b border-[#EEF2F6] last:border-b-0">
    <CompanyLink id={company.id} className={cn(COMPANY_GRID_CLASS, LIST_ROW_CLASS)}>
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar name={company.name} tone="amber" size="medium" />
        <span className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-[15px] font-semibold lg:text-[13px]">
            <ScreenReaderText>{text.open}</ScreenReaderText>
            {company.name}
          </span>
          <span aria-hidden="true" className="truncate text-[13px] text-[#64748B]">
            {company.city ?? company.department}
          </span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "hidden truncate text-[13px] lg:block",
          company.mainContact === null && MUTED_CLASS,
        )}
      >
        {company.mainContact?.name ?? text.noContact}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "hidden text-[13px] whitespace-nowrap tabular-nums lg:block",
          company.phone === null ? MUTED_CLASS : "text-[#475569]",
        )}
      >
        {company.phone ?? text.noPhone}
      </span>
      <StageLabel
        stage={company.stage}
        isShort
        isHiddenFromScreenReaders
        className="gap-1.5 text-[13px] lg:hidden"
      />
      <StageLabel
        stage={company.stage}
        isHiddenFromScreenReaders
        className="hidden text-[13px] lg:inline-flex"
      />
      {company.owner === null ? (
        <span aria-hidden="true" className={cn("hidden text-[13px] lg:block", MUTED_CLASS)}>
          {text.noOwner}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(NEUTRAL_BADGE_CLASS, "hidden justify-self-start truncate lg:inline-flex")}
        >
          {company.owner.name}
        </span>
      )}
      <ChevronRight aria-hidden="true" className="hidden size-4 text-[#94A3B8] lg:block" />
    </CompanyLink>
  </li>
);
