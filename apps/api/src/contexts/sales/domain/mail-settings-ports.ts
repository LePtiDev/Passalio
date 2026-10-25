import type { PlatformActor, Result } from "@passalio/shared";
import type { MailboxDeliveryError } from "./mail-settings-error";
import type {
  ChangedMailSetting,
  Mailbox,
  MailSettings,
  MailSettingsRow,
  Member,
  OutgoingMail,
} from "./mail-settings-models";

export type MailSettingsRepository = {
  readonly find: (userId: string) => Promise<MailSettingsRow | undefined>;
  readonly save: (settings: MailSettings) => Promise<void>;
  readonly markVerified: (userId: string, at: Date) => Promise<void>;
};

export type PasswordCipher = {
  readonly encrypt: (plain: string) => Promise<string>;
  readonly decrypt: (cipher: string) => Promise<string>;
};

export type MailTransport = {
  readonly send: (
    mailbox: Mailbox,
    mail: OutgoingMail,
  ) => Promise<Result<null, MailboxDeliveryError>>;
};

export type MemberDirectory = {
  readonly find: (userId: string) => Promise<Member | undefined>;
};

export type MailSettingsChangeNotice = {
  readonly member: Member;
  readonly editor: PlatformActor;
  readonly changes: readonly ChangedMailSetting[];
  readonly at: Date;
};

export type MailSettingsNotifier = {
  readonly changedByOther: (notice: MailSettingsChangeNotice) => Promise<void>;
};

export type MailSettingsAudit = {
  readonly updated: (
    actorUserId: string,
    memberUserId: string,
    changes: readonly ChangedMailSetting[],
  ) => Promise<void>;
};

export type MailboxTestContent = (at: Date) => Omit<OutgoingMail, "to">;

export type MailSettingsDependencies = {
  readonly settings: MailSettingsRepository;
  readonly cipher: PasswordCipher;
  readonly transport: MailTransport;
  readonly members: MemberDirectory;
  readonly notifier: MailSettingsNotifier;
  readonly audit: MailSettingsAudit;
  readonly testContent: MailboxTestContent;
  readonly now: () => Date;
};
