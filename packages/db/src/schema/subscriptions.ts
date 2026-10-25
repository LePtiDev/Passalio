import { BILLING_INTERVALS, PLANS, SUBSCRIPTION_STATUSES } from "@passalio/shared";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, organizationIdColumn, timestampColumns } from "../columns";
import { organizations } from "./organizations";

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: idColumn(),
    organizationId: organizationIdColumn().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    plan: text("plan", { enum: PLANS }).notNull(),
    interval: text("interval", { enum: BILLING_INTERVALS }).notNull(),
    isFounder: integer("is_founder", { mode: "boolean" }).notNull(),
    status: text("status", { enum: SUBSCRIPTION_STATUSES }).notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
    isCancelScheduled: integer("is_cancel_scheduled", { mode: "boolean" }).notNull(),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    paymentFailedAt: integer("payment_failed_at", { mode: "timestamp_ms" }),
    paymentMethodType: text("payment_method_type"),
    paymentMethodLast4: text("payment_method_last4"),
    ...timestampColumns(),
  },
  (table) => [uniqueIndex("subscriptions_organization_id_idx").on(table.organizationId)],
);

export const stripeEvents = sqliteTable("stripe_events", {
  id: idColumn(),
  type: text("type").notNull(),
  receivedAt: integer("received_at", { mode: "timestamp_ms" }).notNull(),
});
