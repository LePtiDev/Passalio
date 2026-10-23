import { prospectCompanies, prospectEvents, users } from "@passalio/db";
import { normalizeSearchText, type ProspectStage } from "@passalio/shared";
import { and, asc, count, eq, getTableColumns, gt, isNotNull, like, or } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { CompanyPageRequest, CompanyRepository, CompanyScope } from "../domain/prospect-ports";
import { mainContactsOf } from "./main-contacts";

const PIN_LIMIT = 2000;

const scopeOf = ({ department, ownerUserId }: CompanyScope) =>
  and(
    department === undefined ? undefined : eq(prospectCompanies.department, department),
    ownerUserId === undefined ? undefined : eq(prospectCompanies.ownerUserId, ownerUserId),
  );

const pageFilterOf = (request: CompanyPageRequest) =>
  and(
    scopeOf(request),
    request.stage === undefined ? undefined : eq(prospectCompanies.stage, request.stage),
    request.query === undefined
      ? undefined
      : like(prospectCompanies.searchText, `%${normalizeSearchText(request.query)}%`),
    request.after === undefined
      ? undefined
      : or(
          gt(prospectCompanies.searchName, request.after.searchName),
          and(
            eq(prospectCompanies.searchName, request.after.searchName),
            gt(prospectCompanies.id, request.after.id),
          ),
        ),
  );

const summaryColumns = {
  id: prospectCompanies.id,
  name: prospectCompanies.name,
  searchName: prospectCompanies.searchName,
  city: prospectCompanies.city,
  department: prospectCompanies.department,
  phone: prospectCompanies.phone,
  stage: prospectCompanies.stage,
  ownerId: users.id,
  ownerName: users.name,
};

type SummaryRecord = {
  readonly id: string;
  readonly name: string;
  readonly searchName: string;
  readonly city: string | null;
  readonly department: string;
  readonly phone: string | null;
  readonly stage: ProspectStage;
  readonly ownerId: string | null;
  readonly ownerName: string | null;
};

const withContacts = async (database: Database, records: readonly SummaryRecord[]) => {
  const mainContacts = await mainContactsOf(
    database,
    records.map(({ id }) => id),
  );
  return records.map(({ ownerId, ownerName, ...record }) => ({
    ...record,
    owner: ownerId === null || ownerName === null ? null : { id: ownerId, name: ownerName },
    mainContact: mainContacts.get(record.id) ?? null,
  }));
};

export const createD1CompanyRepository = (database: Database): CompanyRepository => ({
  create: async (company) => {
    await database.insert(prospectCompanies).values(company);
  },
  findById: async (companyId) =>
    database
      .select(getTableColumns(prospectCompanies))
      .from(prospectCompanies)
      .where(eq(prospectCompanies.id, companyId))
      .get(),
  update: async (companyId, changes) => {
    await database
      .update(prospectCompanies)
      .set(changes)
      .where(eq(prospectCompanies.id, companyId));
  },
  changeStage: async (companyId, stage, event) => {
    await database.batch([
      database
        .update(prospectCompanies)
        .set({ stage, updatedAt: event.createdAt })
        .where(eq(prospectCompanies.id, companyId)),
      database.insert(prospectEvents).values(event),
    ]);
  },
  delete: async (companyId) => {
    await database.delete(prospectCompanies).where(eq(prospectCompanies.id, companyId));
  },
  list: async (request) =>
    withContacts(
      database,
      await database
        .select(summaryColumns)
        .from(prospectCompanies)
        .leftJoin(users, eq(users.id, prospectCompanies.ownerUserId))
        .where(pageFilterOf(request))
        .orderBy(asc(prospectCompanies.searchName), asc(prospectCompanies.id))
        .limit(request.limit)
        .all(),
    ),
  countByStage: async (scope) =>
    database
      .select({ stage: prospectCompanies.stage, count: count() })
      .from(prospectCompanies)
      .where(scopeOf(scope))
      .groupBy(prospectCompanies.stage)
      .all(),
  summaryOf: async (companyId) => {
    const records = await database
      .select(summaryColumns)
      .from(prospectCompanies)
      .leftJoin(users, eq(users.id, prospectCompanies.ownerUserId))
      .where(eq(prospectCompanies.id, companyId))
      .all();
    return (await withContacts(database, records)).at(0);
  },
  pins: async (department, stage) => {
    const rows = await database
      .select({
        id: prospectCompanies.id,
        name: prospectCompanies.name,
        city: prospectCompanies.city,
        phone: prospectCompanies.phone,
        stage: prospectCompanies.stage,
        latitude: prospectCompanies.latitude,
        longitude: prospectCompanies.longitude,
      })
      .from(prospectCompanies)
      .where(
        and(
          department === undefined ? undefined : eq(prospectCompanies.department, department),
          stage === undefined ? undefined : eq(prospectCompanies.stage, stage),
          isNotNull(prospectCompanies.latitude),
          isNotNull(prospectCompanies.longitude),
        ),
      )
      .orderBy(asc(prospectCompanies.searchName))
      .limit(PIN_LIMIT)
      .all();
    return rows.flatMap(({ latitude, longitude, ...pin }) =>
      latitude === null || longitude === null ? [] : [{ ...pin, latitude, longitude }],
    );
  },
  departments: async () =>
    database
      .select({ code: prospectCompanies.department, count: count() })
      .from(prospectCompanies)
      .groupBy(prospectCompanies.department)
      .orderBy(asc(prospectCompanies.department))
      .all(),
});
