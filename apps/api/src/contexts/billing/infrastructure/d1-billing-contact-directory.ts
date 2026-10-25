import { users } from "@passalio/db";
import { eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { BillingContactDirectory } from "../domain/billing-ports";

export const createD1BillingContactDirectory = (database: Database): BillingContactDirectory => ({
  findEmail: async (userId) =>
    (await database.select({ email: users.email }).from(users).where(eq(users.id, userId)).get())
      ?.email,
});
