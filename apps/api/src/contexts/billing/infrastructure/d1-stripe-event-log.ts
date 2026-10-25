import { stripeEvents } from "@passalio/db";
import { eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { StripeEventLog } from "../domain/billing-ports";

export const createD1StripeEventLog = (database: Database): StripeEventLog => ({
  hasProcessed: async (eventId) =>
    (await database
      .select({ id: stripeEvents.id })
      .from(stripeEvents)
      .where(eq(stripeEvents.id, eventId))
      .get()) !== undefined,
  markProcessed: async ({ id, type }, at) => {
    await database
      .insert(stripeEvents)
      .values({ id, type, receivedAt: at })
      .onConflictDoNothing({ target: stripeEvents.id });
  },
});
