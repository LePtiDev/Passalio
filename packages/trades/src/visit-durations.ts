import * as z from "zod";
import { TRADE_IDS, type TradeId } from "./trade-ids";

export const VISIT_DURATION_STEP_MINUTES = 15;
export const MIN_VISIT_DURATION_MINUTES = 15;
export const MAX_VISIT_DURATION_MINUTES = 8 * 60;

export const DEFAULT_VISIT_MINUTES: Readonly<Record<TradeId, number>> = {
  chimney_sweeping: 60,
  stove_maintenance: 90,
  boiler_maintenance: 60,
  heat_pump_maintenance: 90,
  septic_tank_emptying: 120,
};

export const visitDurationMinutes = z
  .int()
  .min(MIN_VISIT_DURATION_MINUTES)
  .max(MAX_VISIT_DURATION_MINUTES)
  .multipleOf(VISIT_DURATION_STEP_MINUTES);

export const visitDurations = z.partialRecord(z.enum(TRADE_IDS), visitDurationMinutes);

export type VisitDurations = z.infer<typeof visitDurations>;

export const visitTypes = z.array(z.enum(TRADE_IDS)).max(TRADE_IDS.length);

export const isVisitType = (value: string): value is TradeId =>
  TRADE_IDS.some((tradeId) => tradeId === value);

export const visitMinutesOf = (tradeId: TradeId, durations: VisitDurations) =>
  durations[tradeId] ?? DEFAULT_VISIT_MINUTES[tradeId];

export const totalVisitMinutes = (types: readonly TradeId[], durations: VisitDurations) =>
  types.reduce((total, tradeId) => total + visitMinutesOf(tradeId, durations), 0);
