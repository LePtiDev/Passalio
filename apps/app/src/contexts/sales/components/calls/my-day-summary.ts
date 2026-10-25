import type { ProspectMyDayResponse, ProspectTaskResponse } from "@passalio/shared";

export type MyDaySummary = {
  readonly callsToday: number;
  readonly callbacks: number;
  readonly nextCallbackAt: Date | null;
  readonly overdue: number;
  readonly demos: number;
};

export const isOverdue = (task: ProspectTaskResponse, now: Date) => new Date(task.dueAt) < now;

export const myDaySummaryOf = (day: ProspectMyDayResponse, now: Date): MyDaySummary => {
  const callbacks = day.tasks.filter(({ kind }) => kind === "callback");
  const next = callbacks.find((task) => !isOverdue(task, now));
  return {
    callsToday: day.counts.callsToday,
    callbacks: callbacks.length,
    nextCallbackAt: next === undefined ? null : new Date(next.dueAt),
    overdue: day.counts.overdue,
    demos: day.tasks.filter(({ kind }) => kind === "demo").length,
  };
};
