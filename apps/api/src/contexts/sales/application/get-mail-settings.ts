import { err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type { MailSettingsError } from "../domain/mail-settings-error";
import type { MailSettingsRow, Member } from "../domain/mail-settings-models";
import type { MailSettingsDependencies } from "../domain/mail-settings-ports";
import { assertCanManageMailSettings } from "../domain/mail-settings-rules";

export type MemberMailSettings = {
  readonly member: Member;
  readonly settings: MailSettingsRow | undefined;
};

export const getMailSettings =
  ({ settings, members }: Pick<MailSettingsDependencies, "settings" | "members">) =>
  async (
    actor: PlatformActor,
    memberUserId: string,
  ): Promise<Result<MemberMailSettings, MailSettingsError>> => {
    assertCanManageMailSettings(actor, memberUserId);
    const member = await members.find(memberUserId);
    if (member === undefined) {
      return err("member_not_found");
    }
    return ok({ member, settings: await settings.find(memberUserId) });
  };
