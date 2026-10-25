import type {
  InterestLevel,
  NotifyMode,
  ProspectTeamSize,
  ScheduledNextAction,
  ToolKind,
} from "@passalio/shared";

export type ReminderNotifyMode = Exclude<NotifyMode, "none">;

export type DueReminder = {
  readonly taskId: string;
  readonly kind: ScheduledNextAction;
  readonly notify: NotifyMode;
  readonly dueAt: Date;
  readonly company: { readonly id: string; readonly name: string; readonly city: string | null };
  readonly contactName: string | null;
  readonly phone: string | null;
  readonly lastNote: { readonly text: string; readonly at: Date } | null;
  readonly interest: InterestLevel | null;
  readonly teamSize: ProspectTeamSize | null;
  readonly toolKind: ToolKind | null;
  readonly recipient: string | null;
};

export type SendableReminder = DueReminder & {
  readonly notify: ReminderNotifyMode;
  readonly recipient: string;
};

export type ReminderSkipReason = "no_recipient" | "too_late" | "no_notification";

export type ReminderRun = {
  readonly sentTaskIds: readonly string[];
  readonly skipped: readonly { readonly taskId: string; readonly reason: ReminderSkipReason }[];
  readonly failedTaskIds: readonly string[];
};
