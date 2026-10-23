import { PROSPECT_STAGES, type ProspectStage } from "@passalio/shared";
import { useCallback, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChangeStage } from "../../hooks/use-sales-mutations";
import { salesFr } from "../../fr";

const toStage = (value: string) => PROSPECT_STAGES.find((stage) => stage === value);

type StageMenuProps = {
  readonly companyId: string;
  readonly name: string;
  readonly stage: ProspectStage;
  readonly align: "start" | "end";
  readonly children: ReactNode;
};

export const StageMenu = ({ companyId, name, stage, align, children }: StageMenuProps) => {
  const changeStage = useChangeStage();
  const { mutate } = changeStage;
  const change = useCallback(
    (value: string) => {
      const next = toStage(value);
      if (next !== undefined && next !== stage) {
        mutate({ companyId, name, stage: next });
      }
    },
    [companyId, name, stage, mutate],
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={changeStage.isPending}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-48">
        <DropdownMenuRadioGroup value={stage} onValueChange={change}>
          {PROSPECT_STAGES.map((option) => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              className="min-h-12 text-base lg:min-h-8 lg:text-[13px]"
            >
              {salesFr.stages[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
