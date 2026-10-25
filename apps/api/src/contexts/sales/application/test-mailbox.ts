import { err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type { MailSettingsError } from "../domain/mail-settings-error";
import type { MailSettingsDependencies } from "../domain/mail-settings-ports";
import { assertCanManageMailSettings } from "../domain/mail-settings-rules";

export type MailboxTested = { readonly sentTo: string; readonly verifiedAt: Date };

export const testMailbox =
  ({
    settings,
    cipher,
    transport,
    members,
    testContent,
    now,
  }: Pick<
    MailSettingsDependencies,
    "settings" | "cipher" | "transport" | "members" | "testContent" | "now"
  >) =>
  async (
    actor: PlatformActor,
    memberUserId: string,
  ): Promise<Result<MailboxTested, MailSettingsError>> => {
    assertCanManageMailSettings(actor, memberUserId);
    const member = await members.find(memberUserId);
    if (member === undefined) {
      return err("member_not_found");
    }
    const saved = await settings.find(memberUserId);
    if (saved === undefined) {
      return err("mailbox_not_configured");
    }
    const at = now();
    const sent = await transport.send(
      {
        host: saved.smtpHost,
        port: saved.smtpPort,
        username: saved.smtpUsername,
        password: await cipher.decrypt(saved.smtpPasswordCipher),
        senderName: saved.senderName,
        senderAddress: saved.senderAddress,
        replyTo: saved.replyTo,
      },
      { ...testContent(at), to: saved.senderAddress },
    );
    if (!sent.isOk) {
      return err(sent.error);
    }
    await settings.markVerified(memberUserId, at);
    return ok({ sentTo: saved.senderAddress, verifiedAt: at });
  };
