import { users } from "@passalio/db";
import { newId, PLATFORM_ROLES } from "@passalio/shared";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { AuditTrail } from "../../../platform/audit-trail";
import type { Database } from "../../../platform/database";
import type { SalesDependencies } from "../domain/prospect-ports";
import { createD1CallRepository } from "./d1-call-repository";
import { createD1CompanyRepository } from "./d1-company-repository";
import { createD1ContactRepository } from "./d1-contact-repository";
import { createD1EventRepository } from "./d1-event-repository";
import { createD1FollowUpRepository } from "./d1-follow-up-repository";
import { createD1TaskRepository } from "./d1-task-repository";

const isPlatformUser = inArray(users.role, [...PLATFORM_ROLES]);

export const createSalesDependencies = (
  database: Database,
  auditTrail: AuditTrail,
): SalesDependencies => ({
  companies: createD1CompanyRepository(database),
  contacts: createD1ContactRepository(database),
  events: createD1EventRepository(database),
  calls: createD1CallRepository(database),
  followUps: createD1FollowUpRepository(database),
  tasks: createD1TaskRepository(database),
  people: {
    owners: async () =>
      database
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(isPlatformUser)
        .orderBy(asc(users.name))
        .all(),
    isOwner: async (userId) =>
      (await database
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, userId), isPlatformUser))
        .get()) !== undefined,
  },
  audit: {
    companyDeleted: async (actorUserId, companyId) =>
      auditTrail.record({
        organizationId: null,
        actorUserId,
        action: "prospect.company_deleted",
        targetType: "prospect_company",
        targetId: companyId,
      }),
  },
  now: () => new Date(),
  newId,
});
