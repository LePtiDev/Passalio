import { assertPlatformCan, type PlatformActor } from "@passalio/shared";
import type { PlatformSettingsDependencies } from "../domain/platform-settings-ports";
import type { SignUpSettings } from "../domain/sign-up-settings";

export const getSignUpSettings =
  ({ settings }: Pick<PlatformSettingsDependencies, "settings">) =>
  async (actor: PlatformActor): Promise<SignUpSettings> => {
    assertPlatformCan(actor, "settings:manage");
    return settings.findSignUpSettings();
  };
