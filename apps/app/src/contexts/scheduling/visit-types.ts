import {
  MAX_VISIT_DURATION_MINUTES,
  MIN_VISIT_DURATION_MINUTES,
  TRADE_IDS,
  tradesOfKind,
  VISIT_DURATION_STEP_MINUTES,
  type EquipmentKind,
  type TradeId,
} from "@passalio/trades";
import type { VisitTypeRecord } from "@/lib/db/local-records";

export const DURATION_CHOICES: readonly number[] = Array.from(
  {
    length:
      (MAX_VISIT_DURATION_MINUTES - MIN_VISIT_DURATION_MINUTES) / VISIT_DURATION_STEP_MINUTES + 1,
  },
  (_, index) => MIN_VISIT_DURATION_MINUTES + index * VISIT_DURATION_STEP_MINUTES,
);

export const steppedDuration = (minutes: number, steps: number) =>
  Math.min(
    MAX_VISIT_DURATION_MINUTES,
    Math.max(MIN_VISIT_DURATION_MINUTES, minutes + steps * VISIT_DURATION_STEP_MINUTES),
  );

export const inTradeOrder = <T extends { readonly type: TradeId }>(items: readonly T[]): T[] =>
  items.toSorted((left, right) => TRADE_IDS.indexOf(left.type) - TRADE_IDS.indexOf(right.type));

export const suggestedVisitTypes = (
  offered: readonly VisitTypeRecord[],
  equipmentKinds: readonly EquipmentKind[],
): TradeId[] => {
  const isOffered = (trade: TradeId) => offered.some(({ type }) => type === trade);
  const needed = new Set(
    equipmentKinds.flatMap((kind) => tradesOfKind(kind).find(isOffered) ?? []),
  );
  const suggested = offered.filter(({ type }) => needed.has(type)).map(({ type }) => type);
  const [only] = offered;
  return suggested.length === 0 && offered.length === 1 && only !== undefined
    ? [only.type]
    : suggested;
};

export const chosenVisitTypes = (
  offered: readonly VisitTypeRecord[],
  types: readonly TradeId[],
): VisitTypeRecord[] => offered.filter(({ type }) => types.includes(type));

export const usualMinutesOf = (chosen: readonly VisitTypeRecord[]) =>
  chosen.reduce((total, { minutes }) => total + minutes, 0);

export const toggledVisitType = (types: readonly TradeId[], type: TradeId): TradeId[] =>
  types.includes(type)
    ? types.filter((chosen) => chosen !== type)
    : TRADE_IDS.filter((candidate) => candidate === type || types.includes(candidate));
