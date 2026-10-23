import type { ProspectCompanyResponse, ProspectStage } from "@passalio/shared";
import { useCallback } from "react";
import { useChangeStage } from "../../hooks/use-sales-mutations";
import { salesFr } from "../../fr";

const text = salesFr.prospection;

const CHOICE_CLASS =
  "h-12 min-w-0 truncate rounded-[10px] border border-[#E3E8EF] bg-white px-2 text-[15px] font-semibold text-[#0F2A44] hover:bg-[#F7F9FB] disabled:opacity-50 aria-pressed:border-[#0F2A44] aria-pressed:bg-[#EEF3F8] lg:h-8 lg:rounded-[7px] lg:text-[13px]";

type StageChoiceProps = {
  readonly stage: ProspectStage;
  readonly label: string;
  readonly currentStage: ProspectStage;
  readonly isPending: boolean;
  readonly onChoose: (stage: ProspectStage) => void;
};

const StageChoice = ({ stage, label, currentStage, isPending, onChoose }: StageChoiceProps) => {
  const choose = useCallback(() => onChoose(stage), [onChoose, stage]);
  const isCurrent = currentStage === stage;
  return (
    <button
      type="button"
      aria-pressed={isCurrent}
      disabled={isPending || isCurrent}
      className={CHOICE_CLASS}
      onClick={choose}
    >
      {label}
    </button>
  );
};

type LeadStageButtonsProps = {
  readonly company: ProspectCompanyResponse;
  readonly onChanged: (companyId: string) => void;
};

export const LeadStageButtons = ({ company, onChanged }: LeadStageButtonsProps) => {
  const changeStage = useChangeStage();
  const { mutate } = changeStage;
  const { id, name } = company;
  const choose = useCallback(
    (stage: ProspectStage) =>
      mutate({ companyId: id, name, stage }, { onSuccess: () => onChanged(id) }),
    [mutate, id, name, onChanged],
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      <StageChoice
        stage="qualified"
        label={text.qualify}
        currentStage={company.stage}
        isPending={changeStage.isPending}
        onChoose={choose}
      />
      <StageChoice
        stage="not_interested"
        label={text.reject}
        currentStage={company.stage}
        isPending={changeStage.isPending}
        onChoose={choose}
      />
    </div>
  );
};
