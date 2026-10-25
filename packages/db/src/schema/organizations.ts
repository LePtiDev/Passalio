import {
  BRAND_COLORS,
  DEFAULT_DOCUMENT_TEMPLATE,
  DOCUMENT_TEMPLATES,
  ORGANIZATION_ROLES,
  TEAM_SIZES,
} from "@passalio/shared";
import { LEGAL_FORMS, REGISTRY_KINDS, type TradeId } from "@passalio/trades";
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
  siret: text("siret"),
  address: text("address"),
  phone: text("phone"),
  teamSize: text("team_size", { enum: TEAM_SIZES }),
  legalForm: text("legal_form", { enum: LEGAL_FORMS }),
  shareCapitalEuros: integer("share_capital_euros"),
  registryKind: text("registry_kind", { enum: REGISTRY_KINDS }),
  registryCity: text("registry_city"),
  apeCode: text("ape_code"),
  qualification: text("qualification"),
  trades: text("trades", { mode: "json" }).$type<TradeId[]>().notNull().default([]),
  brandColor: text("brand_color", { enum: BRAND_COLORS }).notNull().default("#0F2A44"),
  documentNumberPrefix: text("document_number_prefix").notNull().default(""),
  nextDocumentNumber: integer("next_document_number").notNull().default(1),
  documentTemplate: text("document_template", { enum: DOCUMENT_TEMPLATES })
    .notNull()
    .default(DEFAULT_DOCUMENT_TEMPLATE),
  contactEmail: text("contact_email"),
  website: text("website"),
  customerMessage: text("customer_message"),
  footerText: text("footer_text"),
  isAdviceAttachedByDefault: integer("is_advice_attached_by_default", { mode: "boolean" })
    .notNull()
    .default(true),
  onboardingCompletedAt: integer("onboarding_completed_at", { mode: "timestamp_ms" }),
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
