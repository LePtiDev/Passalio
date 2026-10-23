import type { UsageTrendResponse } from "@passalio/shared";

export const USAGE_DROP_PERCENT = 20;
export const MIN_PREVIOUS_ACTIVE_DAYS = 5;

export const usageTrend = (recent: number, previous: number): UsageTrendResponse => {
  const changePercent = previous === 0 ? null : Math.round(((recent - previous) / previous) * 100);
  return {
    recent,
    previous,
    changePercent,
    isDropping:
      previous >= MIN_PREVIOUS_ACTIVE_DAYS && recent * 100 <= previous * (100 - USAGE_DROP_PERCENT),
  };
};
