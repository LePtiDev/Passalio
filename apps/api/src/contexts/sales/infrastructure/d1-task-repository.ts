import { prospectCompanies, prospectContacts, prospectTasks, users } from "@passalio/db";
import { and, asc, eq, getTableColumns, isNull, lt, or, type SQL } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { TaskRepository } from "../domain/call-ports";
import { contactNameOf } from "../domain/prospect-rules";

const openTasksWhere = async (database: Database, condition: SQL | undefined, limit: number) => {
  const rows = await database
    .select({
      task: prospectTasks,
      companyName: prospectCompanies.name,
      companyCity: prospectCompanies.city,
      companyPhone: prospectCompanies.phone,
      ownerName: users.name,
      contactFirstName: prospectContacts.firstName,
      contactLastName: prospectContacts.lastName,
    })
    .from(prospectTasks)
    .innerJoin(prospectCompanies, eq(prospectCompanies.id, prospectTasks.companyId))
    .leftJoin(users, eq(users.id, prospectTasks.ownerUserId))
    .leftJoin(prospectContacts, eq(prospectContacts.id, prospectTasks.contactId))
    .where(and(eq(prospectTasks.status, "open"), condition))
    .orderBy(asc(prospectTasks.dueAt), asc(prospectTasks.id))
    .limit(limit)
    .all();
  return rows.map((row) => ({
    ...row.task,
    company: {
      id: row.task.companyId,
      name: row.companyName,
      city: row.companyCity,
      phone: row.companyPhone,
    },
    owner:
      row.task.ownerUserId === null || row.ownerName === null
        ? null
        : { id: row.task.ownerUserId, name: row.ownerName },
    contact:
      row.task.contactId === null || row.contactLastName === null
        ? null
        : {
            id: row.task.contactId,
            name: contactNameOf({ firstName: row.contactFirstName, lastName: row.contactLastName }),
          },
  }));
};

const COMPANY_OPEN_TASKS_LIMIT = 50;

export const createD1TaskRepository = (database: Database): TaskRepository => ({
  findById: async (taskId) =>
    database
      .select(getTableColumns(prospectTasks))
      .from(prospectTasks)
      .where(eq(prospectTasks.id, taskId))
      .get(),
  update: async (taskId, changes) => {
    await database.update(prospectTasks).set(changes).where(eq(prospectTasks.id, taskId));
  },
  openOfCompany: async (companyId) =>
    openTasksWhere(database, eq(prospectTasks.companyId, companyId), COMPANY_OPEN_TASKS_LIMIT),
  openOfOwnerDueBefore: async (ownerUserId, before, limit) =>
    openTasksWhere(
      database,
      and(
        or(eq(prospectTasks.ownerUserId, ownerUserId), isNull(prospectTasks.ownerUserId)),
        lt(prospectTasks.dueAt, before),
      ),
      limit,
    ),
  createFromWebsite: async (task) => {
    await database.insert(prospectTasks).values({ ...task, source: "website" });
  },
});
