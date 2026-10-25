import { platformMailSettings, users } from "@passalio/db";
import { SMTP_PORTS, type SmtpPort } from "@passalio/shared";
import { eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { Database } from "../../../platform/database";
import type { MailSettingsRepository } from "../domain/mail-settings-ports";

const editors = alias(users, "editors");

export class InvalidSmtpPortError extends Error {
  constructor(port: number) {
    super(`Stored SMTP port ${port} is not supported`);
    this.name = "InvalidSmtpPortError";
  }
}

const smtpPortOf = (port: number): SmtpPort => {
  const known = SMTP_PORTS.find((candidate) => candidate === port);
  if (known === undefined) {
    throw new InvalidSmtpPortError(port);
  }
  return known;
};

export const createD1MailSettingsRepository = (database: Database): MailSettingsRepository => ({
  find: async (userId) => {
    const row = await database
      .select({ ...getTableColumns(platformMailSettings), updatedByName: editors.name })
      .from(platformMailSettings)
      .leftJoin(editors, eq(editors.id, platformMailSettings.updatedByUserId))
      .where(eq(platformMailSettings.userId, userId))
      .get();
    return row === undefined ? undefined : { ...row, smtpPort: smtpPortOf(row.smtpPort) };
  },
  save: async (settings) => {
    await database
      .insert(platformMailSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: platformMailSettings.userId,
        set: { ...settings, userId: undefined, createdAt: undefined },
      });
  },
  markVerified: async (userId, at) => {
    await database
      .update(platformMailSettings)
      .set({ verifiedAt: at })
      .where(eq(platformMailSettings.userId, userId));
  },
});
