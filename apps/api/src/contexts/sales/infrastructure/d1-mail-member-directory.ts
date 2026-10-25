import { users } from "@passalio/db";
import { PLATFORM_ROLES } from "@passalio/shared";
import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { MemberDirectory } from "../domain/mail-settings-ports";

export const createD1MailMemberDirectory = (database: Database): MemberDirectory => ({
  find: async (userId) =>
    database
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.id, userId), inArray(users.role, [...PLATFORM_ROLES])))
      .get(),
});
