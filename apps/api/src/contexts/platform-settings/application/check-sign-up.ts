import type { PlatformSettingsDependencies } from "../domain/platform-settings-ports";
import { isSignUpAllowed, normalizeSignUpEmail } from "../domain/sign-up-settings";

export const isSignUpOpen =
  ({ settings }: Pick<PlatformSettingsDependencies, "settings">) =>
  async (): Promise<boolean> =>
    (await settings.findSignUpSettings()).isSignUpOpen;

export const canSignUp =
  ({ settings, invitations, now }: Omit<PlatformSettingsDependencies, "auditTrail">) =>
  async (email: string): Promise<boolean> => {
    const current = await settings.findSignUpSettings();
    if (current.isSignUpOpen) {
      return true;
    }
    return isSignUpAllowed(
      current,
      await invitations.hasPendingInvitation(normalizeSignUpEmail(email), now()),
    );
  };
