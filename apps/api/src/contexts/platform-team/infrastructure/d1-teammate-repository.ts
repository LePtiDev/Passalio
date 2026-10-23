import { sessions, users } from "@passalio/db";
import { isPlatformRole, PLATFORM_ROLES, type PlatformRole } from "@passalio/shared";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { TeammateRepository } from "../domain/team-ports";

const platformRoleOf = (row: { readonly role: string | null } | undefined) =>
  row?.role !== null && isPlatformRole(row?.role) ? row.role : undefined;

const lastSignInAtColumn = sql<
  number | null
>`(select max(signed_in.created_at) from sessions as signed_in where signed_in.user_id = users.id and signed_in.impersonated_by is null)`;

export const createD1TeammateRepository = (database: Database): TeammateRepository => {
  const setRole = (userId: string, role: PlatformRole | "user") =>
    database.batch([
      database.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId)),
      database.delete(sessions).where(eq(sessions.userId, userId)),
    ]);

  return {
    list: async () => {
      const rows = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          twoFactorEnabled: users.twoFactorEnabled,
          lastSignInAt: lastSignInAtColumn,
        })
        .from(users)
        .where(inArray(users.role, [...PLATFORM_ROLES]))
        .orderBy(asc(users.name))
        .all();
      return rows.flatMap(({ role, twoFactorEnabled, lastSignInAt, ...row }) =>
        role !== null && isPlatformRole(role)
          ? [
              {
                ...row,
                role,
                isTwoFactorEnabled: twoFactorEnabled === true,
                lastSignInAt: lastSignInAt === null ? null : new Date(lastSignInAt),
              },
            ]
          : [],
      );
    },
    findRole: async (userId) =>
      platformRoleOf(
        await database.select({ role: users.role }).from(users).where(eq(users.id, userId)).get(),
      ),
    findRoleByEmail: async (email) =>
      platformRoleOf(
        await database.select({ role: users.role }).from(users).where(eq(users.email, email)).get(),
      ),
    changeRole: async (userId, role) => {
      await setRole(userId, role);
    },
    remove: async (userId) => {
      await setRole(userId, "user");
    },
    findName: async (userId) =>
      (await database.select({ name: users.name }).from(users).where(eq(users.id, userId)).get())
        ?.name,
  };
};
