import { ORGANIZATION_ROLES } from "@passalio/shared";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { defaultedTimestampColumns, idColumn, organizationIdColumn } from "../columns";
import { users } from "./users";

export const INVITATION_STATUSES = ["pending", "accepted", "rejected", "canceled"] as const;

export const organizations = sqliteTable("organizations", {
  id: idColumn(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  ...defaultedTimestampColumns(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const members = sqliteTable(
  "members",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ORGANIZATION_ROLES }).notNull(),
    ...defaultedTimestampColumns(),
  },
  (table) => [
    index("members_user_id_idx").on(table.userId),
    uniqueIndex("members_organization_id_user_id_idx").on(table.organizationId, table.userId),
  ],
);

export const invitations = sqliteTable(
  "invitations",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    role: text("role", { enum: ORGANIZATION_ROLES }).notNull(),
    status: text("status", { enum: INVITATION_STATUSES }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("invitations_organization_id_status_idx").on(table.organizationId, table.status),
    index("invitations_email_idx").on(table.email),
  ],
);
