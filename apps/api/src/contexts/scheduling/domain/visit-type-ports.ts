import type { TradeId, VisitDurations } from "@passalio/trades";

export type VisitTypeSettings = {
  readonly trades: readonly TradeId[];
  readonly durations: VisitDurations;
};

export type VisitTypeSettingsRepository = {
  readonly find: (organizationId: string) => Promise<VisitTypeSettings | undefined>;
  readonly saveDurations: (organizationId: string, durations: VisitDurations) => Promise<void>;
};

export type VisitTypeDependencies = {
  readonly settings: VisitTypeSettingsRepository;
};

export type VisitTypeError = "organization_not_found" | "invalid_visit_type";
