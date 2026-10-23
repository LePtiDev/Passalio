import type { ProspectStage } from "@passalio/shared";

export const STAGE_COLORS: Readonly<Record<ProspectStage, string>> = {
  to_qualify: "#94A3B8",
  qualified: "#0F2A44",
  interested: "#0E7C5A",
  demo_planned: "#B45309",
  customer: "#2563EB",
  not_interested: "#B42318",
};
