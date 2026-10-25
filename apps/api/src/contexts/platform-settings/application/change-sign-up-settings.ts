import {
  assertPlatformCan,
  type ChangeSignUpSettingsBody,
  type PlatformActor,
} from "@passalio/shared";
import type { PlatformSettingsDependencies } from "../domain/platform-settings-ports";
import type { SignUpSettings } from "../domain/sign-up-settings";

export const changeSignUpSettings =
  ({ settings, auditTrail, now }: Omit<PlatformSettingsDependencies, "invitations">) =>
  async (actor: PlatformActor, input: ChangeSignUpSettingsBody): Promise<SignUpSettings> => {
    assertPlatformCan(actor, "settings:manage");
    const current = await settings.findSignUpSettings();
    if (current.isSignUpOpen === input.isSignUpOpen) {
      return current;
    }
    await settings.saveSignUpSettings({
      isSignUpOpen: input.isSignUpOpen,
      changedAt: now(),
      changedByUserId: actor.userId,
    });
    await auditTrail.record({
      actorUserId: actor.userId,
      action: input.isSignUpOpen ? "platform.sign_up_opened" : "platform.sign_up_closed",
    });
    return settings.findSignUpSettings();
  };
