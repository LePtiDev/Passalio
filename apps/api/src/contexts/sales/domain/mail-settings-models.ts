import type { MailProvider, NotifyMode, SmtpPort } from "@passalio/shared";

export type MailSettings = {
  readonly userId: string;
  readonly senderName: string;
  readonly senderAddress: string;
  readonly replyTo: string | null;
  readonly provider: MailProvider;
  readonly smtpHost: string;
  readonly smtpPort: SmtpPort;
  readonly smtpUsername: string;
  readonly smtpPasswordCipher: string;
  readonly passwordUpdatedAt: Date;
  readonly verifiedAt: Date | null;
  readonly signature: string | null;
  readonly reminderNotify: NotifyMode;
  readonly reminderAddress: string | null;
  readonly updatedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type MailSettingsRow = MailSettings & { readonly updatedByName: string | null };

export type MailSettingsField = keyof Pick<
  MailSettings,
  | "senderName"
  | "senderAddress"
  | "replyTo"
  | "provider"
  | "smtpHost"
  | "smtpPort"
  | "smtpUsername"
  | "signature"
  | "reminderNotify"
  | "reminderAddress"
>;

export type ChangedMailSetting = MailSettingsField | "smtpPassword";

export type Member = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export type Mailbox = {
  readonly host: string;
  readonly port: SmtpPort;
  readonly username: string;
  readonly password: string;
  readonly senderName: string;
  readonly senderAddress: string;
  readonly replyTo: string | null;
};

export type OutgoingMail = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
};
