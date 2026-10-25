import { mailboxTestEmail } from "@passalio/emails";
import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { EmailDelivery, EmailSender } from "../../../platform/email";
import type { Logger } from "../../../platform/logger";
import type { MailSettingsDependencies } from "../domain/mail-settings-ports";
import { createAesPasswordCipher } from "./aes-password-cipher";
import { createD1MailMemberDirectory } from "./d1-mail-member-directory";
import { createD1MailSettingsRepository } from "./d1-mail-settings-repository";
import { createLogMailTransport, createSmtpMailTransport } from "./smtp-mail-transport";

export type MailSettingsInfrastructure = {
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly emailSender: EmailSender;
  readonly logger: Logger;
  readonly delivery: EmailDelivery;
  readonly secretKey: string | undefined;
  readonly appUrl: string;
};

export const mailSettingsUrl = (appUrl: string) => `${appUrl}/admin/configuration`;

export const createMailSettingsDependencies = ({
  database,
  auditTrail,
  emailSender,
  logger,
  delivery,
  secretKey,
  appUrl,
}: MailSettingsInfrastructure): MailSettingsDependencies => ({
  settings: createD1MailSettingsRepository(database),
  cipher: createAesPasswordCipher(secretKey),
  transport:
    delivery === "resend" ? createSmtpMailTransport(logger) : createLogMailTransport(logger),
  members: createD1MailMemberDirectory(database),
  notifier: {
    changedByOther: async ({ member, editor, changes, at }) =>
      emailSender.sendMailSettingsChanged({
        email: member.email,
        editorName: editor.name,
        fields: changes,
        at,
        url: mailSettingsUrl(appUrl),
      }),
  },
  audit: {
    updated: async (actorUserId, memberUserId, changes) =>
      auditTrail.record({
        organizationId: null,
        actorUserId,
        action: "mail_settings.updated",
        targetType: "user",
        targetId: memberUserId,
        data: { fields: changes.join(",") },
      }),
  },
  testContent: (at) => mailboxTestEmail({ at, url: appUrl }, appUrl),
  now: () => new Date(),
});
