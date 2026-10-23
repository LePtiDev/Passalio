import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn } from "../columns";
import { INVITATION_STATUSES } from "./organizations";
import { USER_ROLES, users } from "./users";

export const platformInvitations = sqliteTable(
  "platform_invitations",
  {
    id: idColumn(),
    email: text("email").notNull(),
    role: text("role", { enum: USER_ROLES }).notNull(),
    status: text("status", { enum: INVITATION_STATUSES }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("platform_invitations_status_created_at_idx").on(table.status, table.createdAt),
    index("platform_invitations_email_status_idx").on(table.email, table.status),
  ],
);
