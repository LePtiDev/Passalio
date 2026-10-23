import { activityDays, customers, invitations, members, organizations, users } from "@passalio/db";
import { and, asc, count, countDistinct, eq, gt, gte, inArray, isNull, or, sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { ActivityWindow } from "../domain/activity-window";
import type { AccountPageRequest, BackofficeReadModel } from "../domain/backoffice-ports";
import {
  isDroppingUsage,
  previousDays,
  recentDays,
  usageByOrganization,
  type OrganizationUsage,
} from "./activity-queries";

const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g;

const containing = (query: string) => `%${query.replace(LIKE_SPECIAL_CHARACTERS, "\\$&")}%`;

const accountConditions = (
  window: ActivityWindow,
  usage: OrganizationUsage,
  { filter, query, after }: Omit<AccountPageRequest, "limit">,
) =>
  and(
    isNull(organizations.deletedAt),
    filter === "trial" ? gt(organizations.createdAt, window.trialStartedAfter) : undefined,
    filter === "dropping" ? isDroppingUsage(usage) : undefined,
    query === undefined
      ? undefined
      : sql`${organizations.name} like ${containing(query)} escape '\\'`,
    after === undefined
      ? undefined
      : or(
          gt(organizations.name, after.name),
          and(eq(organizations.name, after.name), gt(organizations.id, after.id)),
        ),
  );

const memberUserIds = (database: Database, organizationIds: readonly string[]) =>
  database
    .select({ userId: members.userId })
    .from(members)
    .where(inArray(members.organizationId, [...organizationIds]));

export const createD1AccountReadModel = (
  database: Database,
): Omit<BackofficeReadModel, "journal"> => ({
  countAccounts: async (window) => {
    const usage = usageByOrganization(database, window);
    const counts = await database
      .select({
        all: count(),
        trial: sql<number>`coalesce(sum(${organizations.createdAt} > ${window.trialStartedAfter.getTime()}), 0)`,
        dropping: sql<number>`coalesce(sum(${isDroppingUsage(usage)}), 0)`,
      })
      .from(organizations)
      .leftJoin(usage, eq(usage.organizationId, organizations.id))
      .where(isNull(organizations.deletedAt))
      .get();
    return counts ?? { all: 0, trial: 0, dropping: 0 };
  },
  listAccounts: async (window, request) => {
    const usage = usageByOrganization(database, window);
    return database
      .select({
        id: organizations.id,
        name: organizations.name,
        address: organizations.address,
        createdAt: organizations.createdAt,
        recent: sql<number>`coalesce(${usage.recent}, 0)`,
        previous: sql<number>`coalesce(${usage.previous}, 0)`,
      })
      .from(organizations)
      .leftJoin(usage, eq(usage.organizationId, organizations.id))
      .where(accountConditions(window, usage, request))
      .orderBy(asc(organizations.name), asc(organizations.id))
      .limit(request.limit);
  },
  membersOf: async (window, organizationIds) => {
    const activity = database
      .select({
        userId: activityDays.userId,
        lastActiveDay: sql<string>`max(${activityDays.day})`.as("last_active_day"),
        recent: recentDays(window).as("recent"),
        previous: previousDays(window).as("previous"),
      })
      .from(activityDays)
      .where(
        and(
          gte(activityDays.day, window.historyStart),
          inArray(activityDays.userId, memberUserIds(database, organizationIds)),
        ),
      )
      .groupBy(activityDays.userId)
      .as("activity");
    const rows = await database
      .select({
        organizationId: members.organizationId,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: members.role,
        lastActiveDay: activity.lastActiveDay,
        recent: sql<number>`coalesce(${activity.recent}, 0)`,
        previous: sql<number>`coalesce(${activity.previous}, 0)`,
        isTwoFactorEnabled: users.twoFactorEnabled,
        isBlocked: users.banned,
      })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .leftJoin(activity, eq(activity.userId, members.userId))
      .where(inArray(members.organizationId, [...organizationIds]))
      .orderBy(asc(members.createdAt));
    return rows.map((row) => ({
      ...row,
      isTwoFactorEnabled: row.isTwoFactorEnabled === true,
      isBlocked: row.isBlocked === true,
    }));
  },
  monthlyActivityOf: async (window, organizationIds) =>
    database
      .select({
        organizationId: members.organizationId,
        userId: activityDays.userId,
        month: sql<string>`substr(${activityDays.day}, 1, 7)`,
        activeDays: count(),
      })
      .from(members)
      .innerJoin(
        activityDays,
        and(eq(activityDays.userId, members.userId), gte(activityDays.day, window.historyStart)),
      )
      .where(inArray(members.organizationId, [...organizationIds]))
      .groupBy(members.organizationId, activityDays.userId, sql`substr(${activityDays.day}, 1, 7)`),
  countActivePeople: async (window) => {
    const result = await database
      .select({ people: countDistinct(activityDays.userId) })
      .from(activityDays)
      .where(
        and(
          gte(activityDays.day, window.recentStart),
          inArray(activityDays.userId, database.select({ userId: members.userId }).from(members)),
        ),
      )
      .get();
    return result?.people ?? 0;
  },
  findAccount: async (organizationId) => {
    const customerCount = database
      .select({ value: count() })
      .from(customers)
      .where(and(eq(customers.organizationId, organizationId), isNull(customers.deletedAt)));
    return database
      .select({
        id: organizations.id,
        name: organizations.name,
        siret: organizations.siret,
        address: organizations.address,
        phone: organizations.phone,
        trades: organizations.trades,
        createdAt: organizations.createdAt,
        customerCount: sql<number>`(${customerCount})`,
      })
      .from(organizations)
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .get();
  },
  pendingInvitationsOf: async (organizationId) =>
    database
      .select({
        email: invitations.email,
        role: invitations.role,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .where(and(eq(invitations.organizationId, organizationId), eq(invitations.status, "pending")))
      .orderBy(asc(invitations.createdAt)),
});
