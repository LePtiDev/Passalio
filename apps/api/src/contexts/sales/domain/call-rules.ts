import {
  parisDay,
  parisInstant,
  shiftParisDay,
  type CallOutcome,
  type NextAction,
  type NotifyMode,
  type ProspectStage,
  type ScheduledNextAction,
} from "@passalio/shared";

const MINUTE_IN_MS = 60 * 1000;
const DAY_BEFORE_NOTICE_TIME = "18:00";

export const stageAfterCall = (
  stage: ProspectStage,
  outcome: CallOutcome,
  nextAction: NextAction | null,
): ProspectStage => {
  if (stage === "customer") {
    return stage;
  }
  if (nextAction === "demo") {
    return "demo_planned";
  }
  if (nextAction === "not_interested") {
    return "not_interested";
  }
  return outcome === "answered" && stage === "to_qualify" ? "qualified" : stage;
};

const NOTIFY_AT: Readonly<Record<NotifyMode, (dueAt: Date) => Date | null>> = {
  minutes_15: (dueAt) => new Date(dueAt.getTime() - 15 * MINUTE_IN_MS),
  day_before: (dueAt) => parisInstant(shiftParisDay(parisDay(dueAt), -1), DAY_BEFORE_NOTICE_TIME),
  at_time: (dueAt) => dueAt,
  none: () => null,
};

export const notifyAtOf = (dueAt: Date, notify: NotifyMode): Date | null =>
  NOTIFY_AT[notify](dueAt);

export const startOfParisDay = (at: Date) => parisInstant(parisDay(at), "00:00");

export const startOfNextParisDay = (at: Date) =>
  parisInstant(shiftParisDay(parisDay(at), 1), "00:00");

export const isScheduledNextAction = (action: NextAction | null): action is ScheduledNextAction =>
  action === "demo" || action === "callback";
