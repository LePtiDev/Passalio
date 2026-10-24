import {
  CALL_OUTCOMES,
  CERTIFICATE_VOLUMES,
  DECISION_MAKERS,
  INTEREST_LEVELS,
  NEXT_ACTIONS,
  NOTIFY_MODES,
  PROSPECT_TASK_STATUSES,
  SCHEDULED_NEXT_ACTIONS,
  PROSPECT_TEAM_SIZES,
  TOOL_KINDS,
} from "@passalio/shared";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "../columns";
import { prospectCompanies, prospectContacts } from "./prospects";
import { users } from "./users";

const companyIdColumn = () =>
  text("company_id")
    .notNull()
    .references(() => prospectCompanies.id, { onDelete: "cascade" });

const contactIdColumn = () =>
  text("contact_id").references(() => prospectContacts.id, { onDelete: "set null" });

export const prospectCalls = sqliteTable(
  "prospect_calls",
  {
    id: idColumn(),
    companyId: companyIdColumn(),
    contactId: contactIdColumn(),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    outcome: text("outcome", { enum: CALL_OUTCOMES }).notNull(),
    nextAction: text("next_action", { enum: NEXT_ACTIONS }),
    notes: text("notes"),
    calledAt: integer("called_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("prospect_calls_company_id_called_at_idx").on(table.companyId, table.calledAt),
    index("prospect_calls_author_user_id_called_at_idx").on(table.authorUserId, table.calledAt),
    index("prospect_calls_contact_id_idx").on(table.contactId),
  ],
);

export const prospectFollowUps = sqliteTable("prospect_follow_ups", {
  companyId: text("company_id")
    .primaryKey()
    .references(() => prospectCompanies.id, { onDelete: "cascade" }),
  lastCallAt: integer("last_call_at", { mode: "timestamp_ms" }),
  lastCallOutcome: text("last_call_outcome", { enum: CALL_OUTCOMES }),
  lastCallByUserId: text("last_call_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  interest: text("interest", { enum: INTEREST_LEVELS }),
  teamSize: text("team_size", { enum: PROSPECT_TEAM_SIZES }),
  toolKind: text("tool_kind", { enum: TOOL_KINDS }),
  certificateVolume: text("certificate_volume", { enum: CERTIFICATE_VOLUMES }),
  decisionMaker: text("decision_maker", { enum: DECISION_MAKERS }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const prospectTasks = sqliteTable(
  "prospect_tasks",
  {
    id: idColumn(),
    companyId: companyIdColumn(),
    contactId: contactIdColumn(),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind", { enum: SCHEDULED_NEXT_ACTIONS }).notNull(),
    dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
    notify: text("notify", { enum: NOTIFY_MODES }).notNull(),
    notifyAt: integer("notify_at", { mode: "timestamp_ms" }),
    notifiedAt: integer("notified_at", { mode: "timestamp_ms" }),
    status: text("status", { enum: PROSPECT_TASK_STATUSES }).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("prospect_tasks_owner_user_id_status_due_at_idx").on(
      table.ownerUserId,
      table.status,
      table.dueAt,
    ),
    index("prospect_tasks_company_id_status_idx").on(table.companyId, table.status),
    index("prospect_tasks_contact_id_idx").on(table.contactId),
  ],
);
