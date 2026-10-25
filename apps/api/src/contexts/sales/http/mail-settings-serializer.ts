import type { MailSettingsResponse } from "@passalio/shared";
import type { MemberMailSettings } from "../application/get-mail-settings";

export const serializeMailSettings = ({
  member,
  settings,
}: MemberMailSettings): MailSettingsResponse => ({
  userId: member.id,
  member: { name: member.name, email: member.email },
  settings:
    settings === undefined
      ? null
      : {
          senderName: settings.senderName,
          senderAddress: settings.senderAddress,
          replyTo: settings.replyTo,
          provider: settings.provider,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUsername: settings.smtpUsername,
          hasPassword: settings.smtpPasswordCipher !== "",
          passwordUpdatedAt: settings.passwordUpdatedAt.toISOString(),
          verifiedAt: settings.verifiedAt?.toISOString() ?? null,
          signature: settings.signature,
          reminderNotify: settings.reminderNotify,
          reminderAddress: settings.reminderAddress,
          updatedAt: settings.updatedAt.toISOString(),
          updatedBy:
            settings.updatedByUserId === null || settings.updatedByName === null
              ? null
              : { id: settings.updatedByUserId, name: settings.updatedByName },
        },
});
