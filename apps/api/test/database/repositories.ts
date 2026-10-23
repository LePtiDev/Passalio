import { createD1AccountReadModel } from "../../src/contexts/backoffice/infrastructure/d1-account-read-model";
import { createD1JournalReadModel } from "../../src/contexts/backoffice/infrastructure/d1-journal-read-model";
import { createD1ChangeFeed } from "../../src/contexts/customers/infrastructure/d1-change-feed";
import { createD1CustomerRepository } from "../../src/contexts/customers/infrastructure/d1-customer-repository";
import { createD1EquipmentRepository } from "../../src/contexts/customers/infrastructure/d1-equipment-repository";
import { createD1OrganizationTrades } from "../../src/contexts/customers/infrastructure/d1-organization-trades";
import { createD1PhotoRepository } from "../../src/contexts/customers/infrastructure/d1-photo-repository";
import { createD1SiteRepository } from "../../src/contexts/customers/infrastructure/d1-site-repository";
import { createD1InvitationRepository } from "../../src/contexts/identity/infrastructure/d1-invitation-repository";
import { createD1MemberRepository } from "../../src/contexts/identity/infrastructure/d1-member-repository";
import { createD1OrganizationRepository } from "../../src/contexts/identity/infrastructure/d1-organization-repository";
import { findMcpCaller } from "../../src/contexts/mcp/infrastructure/mcp-caller-repository";
import { countMcpCall } from "../../src/contexts/mcp/infrastructure/mcp-rate-limit";
import { createD1TeamInvitationRepository } from "../../src/contexts/platform-team/infrastructure/d1-team-invitation-repository";
import { createD1TeammateRepository } from "../../src/contexts/platform-team/infrastructure/d1-teammate-repository";
import { createD1CompanyRepository } from "../../src/contexts/sales/infrastructure/d1-company-repository";
import { createD1ContactRepository } from "../../src/contexts/sales/infrastructure/d1-contact-repository";
import { createD1EventRepository } from "../../src/contexts/sales/infrastructure/d1-event-repository";
import { mainContactsOf } from "../../src/contexts/sales/infrastructure/main-contacts";
import { createSalesDependencies } from "../../src/contexts/sales/infrastructure/sales-dependencies";
import { createActivityLog } from "../../src/platform/activity-log";
import { createAuditTrail } from "../../src/platform/audit-trail";
import type { Database } from "../../src/platform/database";
import { createAuthSessions } from "./auth-sessions";

export const TRACE_ID = "0192f3a4-5b6c-7d8e-9f01-23456789abcd";

export const createRepositories = (database: Database) => {
  const auditTrail = createAuditTrail(database, TRACE_ID);
  const sales = createSalesDependencies(database, auditTrail);
  return {
    customers: createD1CustomerRepository(database),
    sites: createD1SiteRepository(database),
    equipments: createD1EquipmentRepository(database),
    photos: createD1PhotoRepository(database),
    organizationTrades: createD1OrganizationTrades(database),
    changes: createD1ChangeFeed(database),
    organizations: createD1OrganizationRepository(database),
    members: createD1MemberRepository(database),
    invitations: createD1InvitationRepository(database),
    prospectCompanies: createD1CompanyRepository(database),
    prospectContacts: createD1ContactRepository(database),
    prospectEvents: createD1EventRepository(database),
    prospectMainContacts: {
      of: (companyIds: readonly string[]) => mainContactsOf(database, companyIds),
    },
    salesPeople: sales.people,
    salesAudit: sales.audit,
    backofficeAccounts: createD1AccountReadModel(database),
    backofficeJournal: createD1JournalReadModel(database),
    teammates: createD1TeammateRepository(database),
    teamInvitations: createD1TeamInvitationRepository(database),
    mcp: {
      findCaller: (userId: string) => findMcpCaller(database, userId),
      countCall: (userId: string, now: Date) => countMcpCall(database, userId, now),
    },
    auditTrail,
    activityLog: createActivityLog(database),
    authSessions: createAuthSessions(database, TRACE_ID),
  };
};

export type Repositories = ReturnType<typeof createRepositories>;

export const repositoryMethodsOf = (repositories: Repositories): readonly string[] =>
  Object.entries(repositories)
    .flatMap(([repository, methods]) =>
      Object.keys(methods).map((method) => `${repository}.${method}`),
    )
    .toSorted((left, right) => left.localeCompare(right));
