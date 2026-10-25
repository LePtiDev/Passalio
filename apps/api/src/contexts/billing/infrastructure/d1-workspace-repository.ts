import { organizations, subscriptions } from "@passalio/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { Subscription } from "../domain/billing-models";
import type { WorkspaceRepository } from "../domain/billing-ports";

type SubscriptionRow = typeof subscriptions.$inferSelect;

export const subscriptionOfRow = ({
  paymentMethodType,
  paymentMethodLast4,
  ...row
}: SubscriptionRow): Subscription => ({
  ...row,
  paymentMethod:
    paymentMethodType === null ? null : { type: paymentMethodType, last4: paymentMethodLast4 },
});

export const createD1WorkspaceRepository = (database: Database): WorkspaceRepository => ({
  findWorkspace: async (organizationId) => {
    const row = await database
      .select({ organizationCreatedAt: organizations.createdAt, subscription: subscriptions })
      .from(organizations)
      .leftJoin(subscriptions, eq(subscriptions.organizationId, organizationId))
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .get();
    return row === undefined
      ? undefined
      : {
          organizationId,
          organizationCreatedAt: row.organizationCreatedAt,
          subscription: row.subscription === null ? null : subscriptionOfRow(row.subscription),
        };
  },
});
