import { err, ok, type Result } from "@passalio/shared";
import { visitMinutesOf, type TradeId, type VisitDurations } from "@passalio/trades";
import type { VisitTypeError, VisitTypeSettings } from "./visit-type-ports";

export type VisitType = {
  readonly type: TradeId;
  readonly minutes: number;
};

export const visitTypesOf = ({ trades, durations }: VisitTypeSettings): VisitType[] =>
  trades.map((type) => ({ type, minutes: visitMinutesOf(type, durations) }));

export const mergedDurations = (
  settings: VisitTypeSettings,
  changes: VisitDurations,
): Result<VisitDurations, VisitTypeError> => {
  const changedTypes = Object.keys(changes);
  return changedTypes.every((type) => settings.trades.some((trade) => trade === type))
    ? ok({ ...settings.durations, ...changes })
    : err("invalid_visit_type");
};
