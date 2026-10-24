import type { TradeId } from "@passalio/trades";
import { ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { CARD_CLASS } from "@/contexts/customers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { formatDuration, schedulingFr, VISIT_TYPE_LABELS } from "../../fr";
import { DURATION_CHOICES } from "../../visit-types";
import { VisitTypeIcon } from "./visit-type-icon";

const text = schedulingFr.visitTypes;

const ROW_CLASS = "flex w-full items-center gap-3 px-3.5 text-left";

type RowProps = {
  readonly visitType: VisitTypeRecord;
  readonly canEdit: boolean;
};

const MobileRow = ({
  visitType,
  canEdit,
  onOpen,
}: RowProps & { readonly onOpen: (type: TradeId) => void }) => {
  const open = useCallback(() => onOpen(visitType.type), [onOpen, visitType.type]);
  const content = (
    <>
      <VisitTypeIcon type={visitType.type} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-semibold">{VISIT_TYPE_LABELS[visitType.type].label}</span>
        <span className="text-sm text-[#64748B]">
          {text.defaultDuration(formatDuration(visitType.minutes))}
        </span>
      </span>
    </>
  );
  return canEdit ? (
    <button type="button" onClick={open} className={cn(ROW_CLASS, "min-h-[68px] py-3")}>
      {content}
      <ChevronRight aria-hidden="true" className="size-[18px] text-[#94A3B8]" />
    </button>
  ) : (
    <div className={cn(ROW_CLASS, "min-h-[68px] py-3")}>{content}</div>
  );
};

const DesktopRow = ({
  visitType,
  canEdit,
  isSaving,
  onSave,
}: RowProps & {
  readonly isSaving: boolean;
  readonly onSave: (type: TradeId, minutes: number) => void;
}) => {
  const label = VISIT_TYPE_LABELS[visitType.type].label;
  const choose = useCallback(
    (value: string) => onSave(visitType.type, Number(value)),
    [onSave, visitType.type],
  );
  return (
    <div className={cn(ROW_CLASS, "min-h-[52px] py-2.5 lg:px-4")}>
      <VisitTypeIcon type={visitType.type} />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {canEdit ? (
        <Select value={String(visitType.minutes)} onValueChange={choose} disabled={isSaving}>
          <SelectTrigger
            aria-label={text.defaultDuration(label)}
            className="h-8 w-[140px] rounded-[7px] border-[#D5DDE6] text-[13px] data-[size=default]:h-8"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {DURATION_CHOICES.map((choice) => (
              <SelectItem key={choice} value={String(choice)} className="text-[13px]">
                {formatDuration(choice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-[13px] text-[#475569]">{formatDuration(visitType.minutes)}</span>
      )}
    </div>
  );
};

export const VisitTypeRows = ({
  visitTypes,
  canEdit,
  isDesktop,
  isSaving,
  onOpen,
  onSave,
}: {
  readonly visitTypes: readonly VisitTypeRecord[];
  readonly canEdit: boolean;
  readonly isDesktop: boolean;
  readonly isSaving: boolean;
  readonly onOpen: (type: TradeId) => void;
  readonly onSave: (type: TradeId, minutes: number) => void;
}) => (
  <ul className={cn(CARD_CLASS, "lg:max-w-[620px]")}>
    {visitTypes.map((visitType) => (
      <li key={visitType.type} className="border-b border-[#EEF2F6] last:border-b-0">
        {isDesktop ? (
          <DesktopRow visitType={visitType} canEdit={canEdit} isSaving={isSaving} onSave={onSave} />
        ) : (
          <MobileRow visitType={visitType} canEdit={canEdit} onOpen={onOpen} />
        )}
      </li>
    ))}
  </ul>
);
