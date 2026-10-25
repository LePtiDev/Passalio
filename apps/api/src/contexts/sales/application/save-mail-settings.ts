import {
  err,
  ok,
  type MailSettingsChange,
  type PlatformActor,
  type Result,
} from "@passalio/shared";
import type { MailSettingsError } from "../domain/mail-settings-error";
import type { MailSettingsDependencies } from "../domain/mail-settings-ports";
import {
  assertCanManageMailSettings,
  changedMailSettings,
  isConnectionChanged,
} from "../domain/mail-settings-rules";

export const saveMailSettings =
  ({
    settings,
    cipher,
    members,
    notifier,
    audit,
    now,
  }: Pick<
    MailSettingsDependencies,
    "settings" | "cipher" | "members" | "notifier" | "audit" | "now"
  >) =>
  async (
    actor: PlatformActor,
    memberUserId: string,
    change: MailSettingsChange,
  ): Promise<Result<null, MailSettingsError>> => {
    assertCanManageMailSettings(actor, memberUserId);
    const member = await members.find(memberUserId);
    if (member === undefined) {
      return err("member_not_found");
    }
    const previous = await settings.find(memberUserId);
    const { smtpPassword, ...fields } = change;
    const at = now();
    const password =
      smtpPassword === undefined
        ? previous && { cipher: previous.smtpPasswordCipher, updatedAt: previous.passwordUpdatedAt }
        : { cipher: await cipher.encrypt(smtpPassword), updatedAt: at };
    if (password === undefined) {
      return err("password_required");
    }
    const changes = changedMailSettings(previous, change);
    if (changes.length === 0) {
      return ok(null);
    }
    await settings.save({
      ...fields,
      userId: memberUserId,
      smtpPasswordCipher: password.cipher,
      passwordUpdatedAt: password.updatedAt,
      verifiedAt: isConnectionChanged(changes) ? null : (previous?.verifiedAt ?? null),
      updatedByUserId: actor.userId,
      createdAt: previous?.createdAt ?? at,
      updatedAt: at,
    });
    await audit.updated(actor.userId, memberUserId, changes);
    if (actor.userId !== memberUserId) {
      await notifier.changedByOther({ member, editor: actor, changes, at });
    }
    return ok(null);
  };
