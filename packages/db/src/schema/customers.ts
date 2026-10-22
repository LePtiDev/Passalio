import { BUILDING_TYPES, CIVILITIES, CUSTOMER_KINDS } from "@passalio/shared";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, syncedTimestampColumns } from "../columns";
import { organizations } from "./organizations";

export const customers = sqliteTable(
  "customers",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    kind: text("kind", { enum: CUSTOMER_KINDS }).notNull(),
    civility: text("civility", { enum: CIVILITIES }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    companyName: text("company_name"),
    searchName: text("search_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    secondaryPhone: text("secondary_phone"),
    billingAddress: text("billing_address"),
    billingPostalCode: text("billing_postal_code"),
    billingCity: text("billing_city"),
    notes: text("notes"),
    remindersOptedOutAt: integer("reminders_opted_out_at", { mode: "timestamp_ms" }),
    createdByUserId: text("created_by_user_id").notNull(),
    ...syncedTimestampColumns(),
  },
  (table) => [
    index("customers_organization_id_updated_at_idx").on(table.organizationId, table.updatedAt),
    index("customers_organization_id_search_name_idx").on(table.organizationId, table.searchName),
  ],
);

export const sites = sqliteTable(
  "sites",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    label: text("label"),
    address: text("address").notNull(),
    addressDetails: text("address_details"),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),
    buildingType: text("building_type", { enum: BUILDING_TYPES }).notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    occupantName: text("occupant_name"),
    occupantPhone: text("occupant_phone"),
    accessNotes: text("access_notes"),
    ...syncedTimestampColumns(),
  },
  (table) => [
    index("sites_organization_id_customer_id_idx").on(table.organizationId, table.customerId),
    index("sites_organization_id_updated_at_idx").on(table.organizationId, table.updatedAt),
  ],
);
