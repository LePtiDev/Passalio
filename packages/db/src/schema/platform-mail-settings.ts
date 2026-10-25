import { MAIL_PROVIDERS, NOTIFY_MODES } from "@passalio/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestampColumns } from "../columns";
import { users } from "./users";

export const platformMailSettings = sqliteTable("platform_mail_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  senderAddress: text("sender_address").notNull(),
  replyTo: text("reply_to"),
  provider: text("provider", { enum: MAIL_PROVIDERS }).notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpUsername: text("smtp_username").notNull(),
  smtpPasswordCipher: text("smtp_password_cipher").notNull(),
  passwordUpdatedAt: integer("password_updated_at", { mode: "timestamp_ms" }).notNull(),
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
  signature: text("signature"),
  reminderNotify: text("reminder_notify", { enum: NOTIFY_MODES }).notNull(),
  reminderAddress: text("reminder_address"),
  updatedByUserId: text("updated_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  ...timestampColumns(),
});
