import type { DueReminder, ReminderSkipReason, SendableReminder } from "./reminder-models";

const MINUTE_IN_MS = 60_000;

export const REMINDER_LATENESS_LIMIT_MINUTES = 60;

export type ReminderDecision =
  | { readonly isSendable: true; readonly reminder: SendableReminder }
  | { readonly isSendable: false; readonly reason: ReminderSkipReason };

export const reminderDecisionOf = (reminder: DueReminder, at: Date): ReminderDecision => {
  const { notify, recipient } = reminder;
  if (notify === "none") {
    return { isSendable: false, reason: "no_notification" };
  }
  if (recipient === null) {
    return { isSendable: false, reason: "no_recipient" };
  }
  if (at.getTime() - reminder.dueAt.getTime() > REMINDER_LATENESS_LIMIT_MINUTES * MINUTE_IN_MS) {
    return { isSendable: false, reason: "too_late" };
  }
  return { isSendable: true, reminder: { ...reminder, notify, recipient } };
};
