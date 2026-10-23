import { activityDays, members } from "@passalio/db";
import { and, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { ActivityWindow } from "../domain/activity-window";
import { MIN_PREVIOUS_ACTIVE_DAYS, USAGE_DROP_PERCENT } from "../domain/usage-trend";

export const recentDays = (window: ActivityWindow) =>
  sql<number>`coalesce(sum(case when ${activityDays.day} >= ${window.recentStart} then 1 else 0 end), 0)`;

export const previousDays = (window: ActivityWindow) =>
  sql<number>`coalesce(sum(case when ${activityDays.day} >= ${window.previousStart} and ${activityDays.day} < ${window.recentStart} then 1 else 0 end), 0)`;

export const usageByOrganization = (database: Database, window: ActivityWindow) =>
  database
    .select({
      organizationId: members.organizationId,
      recent: recentDays(window).as("recent"),
      previous: previousDays(window).as("previous"),
    })
    .from(members)
    .innerJoin(
      activityDays,
      and(eq(activityDays.userId, members.userId), gte(activityDays.day, window.previousStart)),
    )
    .groupBy(members.organizationId)
    .as("usage");

export type OrganizationUsage = ReturnType<typeof usageByOrganization>;

export const isDroppingUsage = (usage: OrganizationUsage) =>
  sql<boolean>`(coalesce(${usage.previous}, 0) >= ${MIN_PREVIOUS_ACTIVE_DAYS} and coalesce(${usage.recent}, 0) * 100 <= coalesce(${usage.previous}, 0) * ${100 - USAGE_DROP_PERCENT})`;
