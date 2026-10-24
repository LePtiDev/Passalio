import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { PlatformSettingsDependencies } from "../domain/platform-settings-ports";
import { createD1PendingInvitationLookup } from "./d1-pending-invitation-lookup";
import {
  createD1PlatformSettingsRepository,
  PLATFORM_SETTINGS_ID,
} from "./d1-platform-settings-repository";

export const createPlatformSettingsDependencies = ({
  database,
  auditTrail,
}: {
  readonly database: Database;
  readonly auditTrail: AuditTrail;
}): PlatformSettingsDependencies => ({
  settings: createD1PlatformSettingsRepository(database),
  invitations: createD1PendingInvitationLookup(database),
  auditTrail: {
    record: async ({ actorUserId, action }) =>
      auditTrail.record({
        organizationId: null,
        actorUserId,
        action,
        targetType: "platform_settings",
        targetId: PLATFORM_SETTINGS_ID,
      }),
  },
  now: () => new Date(),
});
