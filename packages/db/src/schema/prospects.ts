import { PROSPECT_EVENT_KINDS, PROSPECT_STAGES } from "@passalio/shared";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "../columns";
import { users } from "./users";

export const prospectCompanies = sqliteTable(
  "prospect_companies",
  {
    id: idColumn(),
    name: text("name").notNull(),
    searchName: text("search_name").notNull(),
    searchText: text("search_text").notNull(),
    legalName: text("legal_name"),
    siren: text("siren"),
    nafCode: text("naf_code"),
    legalForm: text("legal_form"),
    address: text("address"),
    postalCode: text("postal_code"),
    city: text("city"),
    department: text("department").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    activity: text("activity"),
    headcount: text("headcount"),
    currentTool: text("current_tool"),
    foundedOn: text("founded_on"),
    registryStatus: text("registry_status"),
    notes: text("notes"),
    stage: text("stage", { enum: PROSPECT_STAGES }).notNull(),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    sourceRef: text("source_ref"),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("prospect_companies_source_ref_idx").on(table.sourceRef),
    index("prospect_companies_department_stage_search_name_idx").on(
      table.department,
      table.stage,
      table.searchName,
    ),
    index("prospect_companies_department_search_name_idx").on(table.department, table.searchName),
    index("prospect_companies_stage_search_name_idx").on(table.stage, table.searchName),
    index("prospect_companies_search_name_idx").on(table.searchName),
  ],
);

export const prospectContacts = sqliteTable(
  "prospect_contacts",
  {
    id: idColumn(),
    companyId: text("company_id")
      .notNull()
      .references(() => prospectCompanies.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name").notNull(),
    searchName: text("search_name").notNull(),
    jobTitle: text("job_title"),
    isLeader: integer("is_leader", { mode: "boolean" }).notNull().default(false),
    isMain: integer("is_main", { mode: "boolean" }).notNull().default(false),
    phone: text("phone"),
    mobile: text("mobile"),
    email: text("email"),
    bestTime: text("best_time"),
    ...timestampColumns(),
  },
  (table) => [
    index("prospect_contacts_company_id_idx").on(table.companyId),
    index("prospect_contacts_search_name_idx").on(table.searchName),
  ],
);

export const prospectEvents = sqliteTable(
  "prospect_events",
  {
    id: idColumn(),
    companyId: text("company_id")
      .notNull()
      .references(() => prospectCompanies.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => prospectContacts.id, { onDelete: "set null" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind", { enum: PROSPECT_EVENT_KINDS }).notNull(),
    body: text("body"),
    fromStage: text("from_stage", { enum: PROSPECT_STAGES }),
    toStage: text("to_stage", { enum: PROSPECT_STAGES }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("prospect_events_company_id_created_at_idx").on(table.companyId, table.createdAt),
    index("prospect_events_contact_id_created_at_idx").on(table.contactId, table.createdAt),
  ],
);
