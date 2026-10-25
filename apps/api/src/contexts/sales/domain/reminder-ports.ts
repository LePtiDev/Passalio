import type { Result } from "@passalio/shared";
import type { DueReminder, SendableReminder } from "./reminder-models";

export type DueReminderRepository = {
  readonly due: (at: Date, limit: number) => Promise<readonly DueReminder[]>;
  readonly markNotified: (taskId: string, at: Date) => Promise<void>;
};

export type ReminderMailer = {
  readonly send: (reminder: SendableReminder) => Promise<Result<void, "delivery_failed">>;
};

export type ReminderDependencies = {
  readonly reminders: DueReminderRepository;
  readonly mailer: ReminderMailer;
  readonly now: () => Date;
};
