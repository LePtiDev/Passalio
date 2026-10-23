import { auditLogs, organizations, users } from "@passalio/db";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { Database } from "../../../platform/database";
import type { BackofficeReadModel, JournalCursor, JournalScope } from "../domain/backoffice-ports";

const actors = alias(users, "actors");
const impersonators = alias(users, "impersonators");
const targetUsers = alias(users, "target_users");

const scopeCondition = (scope: JournalScope) =>
  "organizationId" in scope
    ? eq(auditLogs.organizationId, scope.organizationId)
    : inArray(auditLogs.action, [...scope.actions]);

const beforeCondition = (before: JournalCursor | undefined) =>
  before === undefined
    ? undefined
    : or(
        lt(auditLogs.createdAt, before.createdAt),
        and(eq(auditLogs.createdAt, before.createdAt), lt(auditLogs.id, before.id)),
      );

export const createD1JournalReadModel = (
  database: Database,
): Pick<BackofficeReadModel, "journal"> => ({
  journal: async (scope, before, limit) =>
    database
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        createdAt: auditLogs.createdAt,
        organizationId: auditLogs.organizationId,
        organizationName: organizations.name,
        actorName: actors.name,
        impersonatorName: impersonators.name,
        targetName: targetUsers.name,
        data: auditLogs.data,
      })
      .from(auditLogs)
      .leftJoin(organizations, eq(organizations.id, auditLogs.organizationId))
      .leftJoin(actors, eq(actors.id, auditLogs.actorUserId))
      .leftJoin(impersonators, eq(impersonators.id, auditLogs.impersonatorUserId))
      .leftJoin(
        targetUsers,
        and(eq(auditLogs.targetType, "user"), eq(targetUsers.id, auditLogs.targetId)),
      )
      .where(and(scopeCondition(scope), beforeCondition(before)))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit),
});
