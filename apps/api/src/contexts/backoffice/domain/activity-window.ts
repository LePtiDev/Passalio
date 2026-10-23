import { lastMonths, parisDay, parisDayBefore } from "@passalio/shared";

export const USAGE_HISTORY_MONTHS = 6;
export const TRIAL_DAYS = 14;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export type ActivityWindow = {
  readonly today: string;
  readonly recentStart: string;
  readonly previousStart: string;
  readonly months: readonly string[];
  readonly historyStart: string;
  readonly trialStartedAfter: Date;
};

export const activityWindow = (now: Date): ActivityWindow => {
  const months = lastMonths(now, USAGE_HISTORY_MONTHS);
  return {
    today: parisDay(now),
    recentStart: parisDayBefore(now, WINDOW_DAYS - 1),
    previousStart: parisDayBefore(now, 2 * WINDOW_DAYS - 1),
    months,
    historyStart: `${months[0] ?? parisDay(now).slice(0, 7)}-01`,
    trialStartedAfter: new Date(now.getTime() - TRIAL_DAYS * DAY_IN_MS),
  };
};

export const trialEndOf = (createdAt: Date): Date =>
  new Date(createdAt.getTime() + TRIAL_DAYS * DAY_IN_MS);
