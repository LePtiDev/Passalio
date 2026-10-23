import type { ProspectCompanyResponse } from "@passalio/shared";
import { ChevronDown, MapPin, Pencil, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortDayLabel } from "../../date-labels";
import { salesFr } from "../../fr";
import { NEUTRAL_BADGE_CLASS } from "../sales-styles";
import { StageDot, StageLabel } from "../stage-label";
import { ProspectionLink } from "./company-map-card";
import { CallLink, CallTile, SECONDARY_ACTION_CLASS, TILE_CLASS, TileButton } from "./file-actions";
import { StageMenu } from "./stage-menu";

const text = salesFr.file;

type CompanyFileHeaderProps = {
  readonly company: ProspectCompanyResponse;
  readonly phone: string | null;
  readonly now: Date;
  readonly onEdit: () => void;
};

const placeOf = (company: ProspectCompanyResponse) =>
  company.city === null ? company.department : `${company.city} (${company.department})`;

export const CompanyFileHeader = ({ company, phone, now, onEdit }: CompanyFileHeaderProps) => (
  <>
    <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-xl leading-tight font-bold tracking-[-0.015em]">
            {company.name}
          </h1>
          <span className={NEUTRAL_BADGE_CLASS}>
            <StageDot stage={company.stage} className="size-[7px]" />
            {salesFr.stages[company.stage]}
          </span>
        </div>
        <p className="text-[13px] text-[#475569]">
          {text.summary(
            placeOf(company),
            company.owner?.name ?? null,
            shortDayLabel(company.createdAt, now),
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <CallLink phone={phone} className={SECONDARY_ACTION_CLASS} />
        <Button variant="outline" className={SECONDARY_ACTION_CLASS} onClick={onEdit}>
          <Pencil aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          {text.edit}
        </Button>
        <StageMenu companyId={company.id} name={company.name} stage={company.stage} align="end">
          <button
            type="button"
            aria-label={text.stageLabel}
            className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-[#E3E8EF] bg-white pr-2 pl-3 text-[13px] font-semibold hover:bg-[#F7F9FB]"
          >
            {text.stage}
            <span>{salesFr.stages[company.stage]}</span>
            <ChevronDown aria-hidden="true" className="size-3.5 text-[#64748B]" />
          </button>
        </StageMenu>
      </div>
    </div>
    <div className="flex flex-col gap-3 lg:hidden">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl leading-tight font-bold">{company.name}</h2>
        <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-[#64748B]">
          <StageLabel stage={company.stage} className="gap-1.5 text-[#0F2A44]" />
          {[company.city, company.owner?.name ?? null]
            .filter((part): part is string => part !== null)
            .map((part) => (
              <span key={part}>· {part}</span>
            ))}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <CallTile phone={phone} />
        <ProspectionLink company={company} className={TILE_CLASS}>
          <MapPin aria-hidden="true" className="size-5 text-[#0E7C5A]" strokeWidth={1.8} />
          {salesFr.prospection.mapTile}
        </ProspectionLink>
        <StageMenu companyId={company.id} name={company.name} stage={company.stage} align="start">
          <TileButton icon={SquareCheckBig} label={text.stage} aria-label={text.stageLabel} />
        </StageMenu>
        <TileButton icon={Pencil} label={text.edit} onClick={onEdit} />
      </div>
    </div>
  </>
);
