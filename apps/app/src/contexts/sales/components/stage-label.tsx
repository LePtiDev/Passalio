import type { ProspectStage } from "@passalio/shared";
import { cn } from "@/lib/utils";
import { salesFr } from "../fr";

const DOT_CLASS: Readonly<Record<ProspectStage, string>> = {
  to_qualify: "bg-[#94A3B8]",
  qualified: "bg-[#0F2A44]",
  interested: "bg-[#0E7C5A]",
  demo_planned: "bg-[#B45309]",
  customer: "bg-[#2563EB]",
  not_interested: "bg-[#B42318]",
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
    className={cn("size-2 shrink-0 rounded-full", DOT_CLASS[stage], className)}
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
