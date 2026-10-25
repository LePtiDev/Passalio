import type { DueReminder, ReminderRun, ReminderSkipReason } from "../domain/reminder-models";
import type { ReminderDependencies } from "../domain/reminder-ports";
import { reminderDecisionOf } from "../domain/reminder-rules";

export const REMINDER_BATCH_SIZE = 50;

type ReminderOutcome =
  | { readonly taskId: string; readonly status: "sent" | "failed" }
  | { readonly taskId: string; readonly status: "skipped"; readonly reason: ReminderSkipReason };

export const sendDueReminders = ({ reminders, mailer, now }: ReminderDependencies) => {
  const handle = async (reminder: DueReminder, at: Date): Promise<ReminderOutcome> => {
    const { taskId } = reminder;
    const decision = reminderDecisionOf(reminder, at);
    if (!decision.isSendable) {
      await reminders.markNotified(taskId, at);
      return { taskId, status: "skipped", reason: decision.reason };
    }
    const sent = await mailer.send(decision.reminder);
    if (!sent.isOk) {
      return { taskId, status: "failed" };
    }
    await reminders.markNotified(taskId, at);
    return { taskId, status: "sent" };
  };

  return async (): Promise<ReminderRun> => {
    const at = now();
    const due = await reminders.due(at, REMINDER_BATCH_SIZE);
    const outcomes = await Promise.all(due.map((reminder) => handle(reminder, at)));
    return {
      sentTaskIds: outcomes.filter(({ status }) => status === "sent").map(({ taskId }) => taskId),
      skipped: outcomes.flatMap((outcome) =>
        outcome.status === "skipped" ? [{ taskId: outcome.taskId, reason: outcome.reason }] : [],
      ),
      failedTaskIds: outcomes
        .filter(({ status }) => status === "failed")
        .map(({ taskId }) => taskId),
    };
  };
};
