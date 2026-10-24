import { platformSettings, users } from "@passalio/db";
import { eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { PlatformSettingsRepository } from "../domain/platform-settings-ports";
import { DEFAULT_SIGN_UP_SETTINGS } from "../domain/sign-up-settings";

export const PLATFORM_SETTINGS_ID = "platform";

export const createD1PlatformSettingsRepository = (
  database: Database,
): PlatformSettingsRepository => ({
  findSignUpSettings: async () => {
    const row = await database
      .select({
        isSignUpOpen: platformSettings.isSignUpOpen,
        changedAt: platformSettings.updatedAt,
        changedByName: users.name,
      })
      .from(platformSettings)
      .leftJoin(users, eq(users.id, platformSettings.updatedByUserId))
      .where(eq(platformSettings.id, PLATFORM_SETTINGS_ID))
      .get();
    return row === undefined
      ? DEFAULT_SIGN_UP_SETTINGS
      : {
          isSignUpOpen: row.isSignUpOpen,
          changedAt: row.changedAt,
          changedByName: row.changedByName,
        };
  },
  saveSignUpSettings: async ({ isSignUpOpen, changedAt, changedByUserId }) => {
    await database
      .insert(platformSettings)
      .values({
        id: PLATFORM_SETTINGS_ID,
        isSignUpOpen,
        updatedAt: changedAt,
        updatedByUserId: changedByUserId,
      })
      .onConflictDoUpdate({
        target: platformSettings.id,
        set: { isSignUpOpen, updatedAt: changedAt, updatedByUserId: changedByUserId },
      });
  },
});
