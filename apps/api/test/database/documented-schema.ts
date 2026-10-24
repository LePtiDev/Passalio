export type DocumentedIndex = {
  readonly table: string;
  readonly columns: readonly string[];
  readonly isUnique: boolean;
};

const index = (table: string, columns: readonly string[]): DocumentedIndex => ({
  table,
  columns,
  isUnique: false,
});

const uniqueIndex = (table: string, columns: readonly string[]): DocumentedIndex => ({
  table,
  columns,
  isUnique: true,
});

export const ARCHITECTURE_INDEXES: readonly DocumentedIndex[] = [
  index("customers", ["organization_id", "updated_at"]),
  index("customers", ["organization_id", "search_name"]),
  index("sites", ["organization_id", "customer_id"]),
  index("sites", ["organization_id", "updated_at"]),
  index("equipments", ["organization_id", "site_id"]),
  index("equipments", ["organization_id", "next_due_date"]),
  index("equipments", ["organization_id", "updated_at"]),
  index("equipment_photos", ["organization_id", "equipment_id"]),
  index("equipment_photos", ["organization_id", "updated_at"]),
  index("plate_readings", ["organization_id", "day"]),
  index("interventions", ["organization_id", "updated_at"]),
  index("services", ["organization_id", "created_at"]),
  uniqueIndex("documents", ["organization_id", "number"]),
  uniqueIndex("documents", ["organization_id", "cancels_document_id"]),
  index("documents", ["organization_id", "updated_at"]),
  index("documents", ["organization_id", "signed_by_user_id", "updated_at"]),
  index("document_number_blocks", ["organization_id", "user_id", "last_number"]),
  index("reminders", ["status", "due_at"]),
  index("reminders", ["organization_id", "equipment_id"]),
  index("notifications", ["organization_id", "created_at"]),
  index("audit_logs", ["organization_id", "created_at"]),
  index("members", ["user_id"]),
  uniqueIndex("members", ["organization_id", "user_id"]),
  index("invitations", ["organization_id", "status"]),
  index("invitations", ["email"]),
  uniqueIndex("sessions", ["token"]),
  index("sessions", ["user_id"]),
  index("accounts", ["user_id"]),
  index("verifications", ["identifier"]),
  uniqueIndex("rate_limits", ["key"]),
  index("rate_limits", ["last_request"]),
  uniqueIndex("prospect_companies", ["source_ref"]),
  index("prospect_companies", ["department", "stage", "search_name"]),
  index("prospect_companies", ["department", "search_name"]),
  index("prospect_companies", ["stage", "search_name"]),
  index("prospect_companies", ["search_name"]),
  index("prospect_contacts", ["company_id"]),
  index("prospect_contacts", ["search_name"]),
  index("prospect_events", ["company_id", "created_at"]),
  index("prospect_events", ["contact_id", "created_at"]),
  index("prospect_calls", ["company_id", "called_at"]),
  index("prospect_calls", ["author_user_id", "called_at"]),
  index("prospect_calls", ["contact_id"]),
  index("prospect_tasks", ["owner_user_id", "status", "due_at"]),
  index("prospect_tasks", ["company_id", "status"]),
  index("prospect_tasks", ["contact_id"]),
  uniqueIndex("users", ["email"]),
  index("users", ["role"]),
  index("platform_invitations", ["status", "created_at"]),
  index("platform_invitations", ["email", "status"]),
];

export const ORGANIZATION_DATA_TABLES = [
  "customers",
  "sites",
  "equipments",
  "equipment_photos",
  "plate_readings",
  "interventions",
  "services",
  "documents",
  "document_number_blocks",
  "members",
  "invitations",
] as const;

export const TABLES_WITHOUT_ORGANIZATION: Readonly<Record<string, string>> = {
  organizations: "the organization itself",
  users: "a person can belong to several organizations",
  sessions: "Better Auth identity",
  accounts: "Better Auth identity",
  verifications: "Better Auth identity",
  two_factors: "Better Auth identity",
  rate_limits: "counters per IP address or user",
  audit_logs: "also records Passalio platform actions, with no organization",
  activity_days: "activity per person, read by the Passalio back office",
  prospect_companies: "Passalio data, see docs/ARCHITECTURE.md",
  prospect_contacts: "Passalio data, see docs/ARCHITECTURE.md",
  prospect_events: "Passalio data, see docs/ARCHITECTURE.md",
  prospect_calls: "Passalio data, see docs/ARCHITECTURE.md",
  prospect_follow_ups: "Passalio data, see docs/ARCHITECTURE.md",
  prospect_tasks: "Passalio data, see docs/ARCHITECTURE.md",
  platform_invitations: "Passalio team",
};

export const PASSALIO_TABLES = [
  "prospect_companies",
  "prospect_contacts",
  "prospect_events",
  "prospect_calls",
  "prospect_follow_ups",
  "prospect_tasks",
];

export const SYNCHRONIZED_TABLES = [
  "customers",
  "sites",
  "equipments",
  "equipment_photos",
  "interventions",
  "documents",
];

export const BETTER_AUTH_TABLES: readonly string[] = [
  "users",
  "sessions",
  "accounts",
  "verifications",
  "two_factors",
  "rate_limits",
  "organizations",
  "members",
  "invitations",
];

export const APPEND_ONLY_TABLES: Readonly<Record<string, string>> = {
  document_number_blocks: "a reserved block is written once and never updated, see ADR 0021",
};

const isOwnTable = (table: string) => !BETTER_AUTH_TABLES.includes(table);

export const OWN_UPDATABLE_ORGANIZATION_TABLES = ORGANIZATION_DATA_TABLES.filter(
  (table) => isOwnTable(table) && !Object.hasOwn(APPEND_ONLY_TABLES, table),
);
