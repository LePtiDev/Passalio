import type { ProspectStage } from "@passalio/shared";
import { cn } from "@/lib/utils";
import { salesFr } from "../fr";
import { STAGE_COLORS } from "./stage-colors";

const DOT_STYLES: Readonly<Record<ProspectStage, { readonly backgroundColor: string }>> = {
  to_qualify: { backgroundColor: STAGE_COLORS.to_qualify },
  qualified: { backgroundColor: STAGE_COLORS.qualified },
  interested: { backgroundColor: STAGE_COLORS.interested },
  demo_planned: { backgroundColor: STAGE_COLORS.demo_planned },
  customer: { backgroundColor: STAGE_COLORS.customer },
  not_interested: { backgroundColor: STAGE_COLORS.not_interested },
};

export const StageDot = ({
  stage,
  className,
}: {
  readonly stage: ProspectStage;
  readonly className?: string;
}) => (
  <span
    aria-hidden="true"
    style={DOT_STYLES[stage]}
    className={cn("size-2 shrink-0 rounded-full", className)}
  />
);

type StageLabelProps = {
  readonly stage: ProspectStage;
  readonly isShort?: boolean;
  readonly className?: string;
};

export const StageLabel = ({ stage, isShort = false, className }: StageLabelProps) => (
  <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}>
    <StageDot stage={stage} />
    {isShort ? salesFr.stageShort[stage] : salesFr.stages[stage]}
  </span>
);
