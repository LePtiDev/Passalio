import { prospectCompanies, prospectContacts } from "@passalio/db";
import { normalizeSearchText } from "@passalio/shared";
import { and, asc, count, eq, getTableColumns, gt, isNull, like, ne, or, sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { ContactPageRequest, ContactRepository } from "../domain/prospect-ports";

const hasNoPhone = and(
  isNull(prospectContacts.phone),
  isNull(prospectContacts.mobile),
  isNull(prospectCompanies.phone),
);

const inDepartment = (department: string | undefined) =>
  department === undefined ? undefined : eq(prospectCompanies.department, department);

const pageFilterOf = (request: ContactPageRequest) => {
  const pattern =
    request.query === undefined ? undefined : `%${normalizeSearchText(request.query)}%`;
  return and(
    inDepartment(request.department),
    request.filter === "leaders" ? eq(prospectContacts.isLeader, true) : undefined,
    request.filter === "no_phone" ? hasNoPhone : undefined,
    pattern === undefined
      ? undefined
      : or(like(prospectContacts.searchName, pattern), like(prospectCompanies.searchName, pattern)),
    request.after === undefined
      ? undefined
      : or(
          gt(prospectContacts.searchName, request.after.searchName),
          and(
            eq(prospectContacts.searchName, request.after.searchName),
            gt(prospectContacts.id, request.after.id),
          ),
        ),
  );
};

export const createD1ContactRepository = (database: Database): ContactRepository => {
  const unsetOtherMains = (companyId: string, contactId: string) =>
    database
      .update(prospectContacts)
      .set({ isMain: false })
      .where(and(eq(prospectContacts.companyId, companyId), ne(prospectContacts.id, contactId)));

  return {
    create: async (contact) => {
      await (contact.isMain
        ? database.batch([
            unsetOtherMains(contact.companyId, contact.id),
            database.insert(prospectContacts).values(contact),
          ])
        : database.insert(prospectContacts).values(contact));
    },
    findById: async (contactId) =>
      database
        .select(getTableColumns(prospectContacts))
        .from(prospectContacts)
        .where(eq(prospectContacts.id, contactId))
        .get(),
    update: async (contactId, changes) => {
      const update = database
        .update(prospectContacts)
        .set(changes)
        .where(eq(prospectContacts.id, contactId));
      const contact =
        changes.isMain === true
          ? await database
              .select({ companyId: prospectContacts.companyId })
              .from(prospectContacts)
              .where(eq(prospectContacts.id, contactId))
              .get()
          : undefined;
      await (contact === undefined
        ? update
        : database.batch([unsetOtherMains(contact.companyId, contactId), update]));
    },
    delete: async (contactId) => {
      await database.delete(prospectContacts).where(eq(prospectContacts.id, contactId));
    },
    listByCompany: async (companyId) =>
      database
        .select(getTableColumns(prospectContacts))
        .from(prospectContacts)
        .where(eq(prospectContacts.companyId, companyId))
        .orderBy(
          sql`${prospectContacts.isMain} desc`,
          sql`${prospectContacts.isLeader} desc`,
          asc(prospectContacts.searchName),
        )
        .all(),
    list: async (request) => {
      const rows = await database
        .select({
          id: prospectContacts.id,
          firstName: prospectContacts.firstName,
          lastName: prospectContacts.lastName,
          searchName: prospectContacts.searchName,
          jobTitle: prospectContacts.jobTitle,
          isLeader: prospectContacts.isLeader,
          email: prospectContacts.email,
          phone: sql<
            string | null
          >`coalesce(${prospectContacts.phone}, ${prospectContacts.mobile}, ${prospectCompanies.phone})`,
          companyId: prospectCompanies.id,
          companyName: prospectCompanies.name,
          companyCity: prospectCompanies.city,
          companyDepartment: prospectCompanies.department,
        })
        .from(prospectContacts)
        .innerJoin(prospectCompanies, eq(prospectCompanies.id, prospectContacts.companyId))
        .where(pageFilterOf(request))
        .orderBy(asc(prospectContacts.searchName), asc(prospectContacts.id))
        .limit(request.limit)
        .all();
      return rows.map(({ companyId, companyName, companyCity, companyDepartment, ...row }) => ({
        ...row,
        company: {
          id: companyId,
          name: companyName,
          city: companyCity,
          department: companyDepartment,
        },
      }));
    },
    counts: async (department) => {
      const row = await database
        .select({
          all: count(),
          leaders: sql<number>`coalesce(sum(${prospectContacts.isLeader}), 0)`,
          noPhone: sql<number>`coalesce(sum(case when ${hasNoPhone} then 1 else 0 end), 0)`,
        })
        .from(prospectContacts)
        .innerJoin(prospectCompanies, eq(prospectCompanies.id, prospectContacts.companyId))
        .where(inDepartment(department))
        .get();
      return {
        all: row?.all ?? 0,
        leaders: row?.leaders ?? 0,
        no_phone: row?.noPhone ?? 0,
      };
    },
  };
};
