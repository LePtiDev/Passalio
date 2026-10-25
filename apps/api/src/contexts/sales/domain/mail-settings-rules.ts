import { assertPlatformCan, type MailSettingsChange, type PlatformActor } from "@passalio/shared";
import type { ChangedMailSetting, MailSettings, MailSettingsField } from "./mail-settings-models";

const MAIL_SETTINGS_FIELDS: readonly MailSettingsField[] = [
  "senderName",
  "senderAddress",
  "replyTo",
  "provider",
  "smtpHost",
  "smtpPort",
  "smtpUsername",
  "signature",
  "reminderNotify",
  "reminderAddress",
];

const CONNECTION_FIELDS: ReadonlySet<ChangedMailSetting> = new Set([
  "smtpHost",
  "smtpPort",
  "smtpUsername",
  "smtpPassword",
  "senderAddress",
]);

export const assertCanManageMailSettings = (actor: PlatformActor, memberUserId: string) => {
  assertPlatformCan(actor, actor.userId === memberUserId ? "prospects:write" : "team:manage");
};

export const changedMailSettings = (
  previous: MailSettings | undefined,
  change: MailSettingsChange,
): ChangedMailSetting[] => {
  const fields = MAIL_SETTINGS_FIELDS.filter(
    (field) => previous === undefined || previous[field] !== change[field],
  );
  return change.smtpPassword === undefined ? fields : [...fields, "smtpPassword"];
};

export const isConnectionChanged = (changes: readonly ChangedMailSetting[]) =>
  changes.some((change) => CONNECTION_FIELDS.has(change));
