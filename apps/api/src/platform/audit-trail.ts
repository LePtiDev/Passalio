import { auditLogs } from "@passalio/db";
import { newId } from "@passalio/shared";
import type { Database } from "./database";

export type AuditEntry = {
  readonly organizationId: string | null;
  readonly actorUserId: string | null;
  readonly impersonatorUserId?: string | null;
  readonly action: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly data?: Readonly<Record<string, string>>;
};

export type AuditTrail = {
  readonly record: (entry: AuditEntry) => Promise<void>;
};

export const createAuditTrail = (database: Database, traceId: string): AuditTrail => ({
  record: async (entry) => {
    await database.insert(auditLogs).values({
      id: newId(),
      organizationId: entry.organizationId,
      actorUserId: entry.actorUserId,
      impersonatorUserId: entry.impersonatorUserId ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      data: entry.data ?? null,
      traceId,
      createdAt: new Date(),
    });
  },
});
