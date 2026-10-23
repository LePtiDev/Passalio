import { users } from "@passalio/db";
import { eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { McpCaller } from "../domain/mcp-access";

export const findMcpCaller = async (
  database: Database,
  userId: string,
): Promise<McpCaller | undefined> => {
  const row = await database
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      banned: users.banned,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return row === undefined
    ? undefined
    : {
        userId: row.userId,
        email: row.email,
        name: row.name,
        role: row.role,
        isBanned: row.banned === true,
      };
};
