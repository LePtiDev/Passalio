import {
  platformMailSettings,
  prospectCalls,
  prospectCompanies,
  prospectContacts,
  prospectFollowUps,
  prospectTasks,
  users,
} from "@passalio/db";
import { and, asc, desc, eq, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import { contactNameOf } from "../domain/prospect-rules";
import type { DueReminderRepository } from "../domain/reminder-ports";

const lastNoteOf = async (database: Database, companyId: string) => {
  const call = await database
    .select({ text: prospectCalls.notes, at: prospectCalls.calledAt })
    .from(prospectCalls)
    .where(and(eq(prospectCalls.companyId, companyId), isNotNull(prospectCalls.notes)))
    .orderBy(desc(prospectCalls.calledAt))
    .limit(1)
    .get();
  return call === undefined || call.text === null ? null : { text: call.text, at: call.at };
};

export const createD1ReminderRepository = (database: Database): DueReminderRepository => ({
  due: async (at, limit) => {
    const rows = await database
      .select({
        taskId: prospectTasks.id,
        kind: prospectTasks.kind,
        notify: prospectTasks.notify,
        dueAt: prospectTasks.dueAt,
        companyId: prospectTasks.companyId,
        companyName: prospectCompanies.name,
        companyCity: prospectCompanies.city,
        companyPhone: prospectCompanies.phone,
        contactFirstName: prospectContacts.firstName,
        contactLastName: prospectContacts.lastName,
        contactMobile: prospectContacts.mobile,
        contactPhone: prospectContacts.phone,
        interest: prospectFollowUps.interest,
        teamSize: prospectFollowUps.teamSize,
        toolKind: prospectFollowUps.toolKind,
        ownerEmail: users.email,
        reminderAddress: platformMailSettings.reminderAddress,
      })
      .from(prospectTasks)
      .innerJoin(prospectCompanies, eq(prospectCompanies.id, prospectTasks.companyId))
      .leftJoin(prospectContacts, eq(prospectContacts.id, prospectTasks.contactId))
      .leftJoin(prospectFollowUps, eq(prospectFollowUps.companyId, prospectTasks.companyId))
      .leftJoin(users, eq(users.id, prospectTasks.ownerUserId))
      .leftJoin(platformMailSettings, eq(platformMailSettings.userId, prospectTasks.ownerUserId))
      .where(
        and(
          sql`${prospectTasks.status} = 'open'`,
          isNull(prospectTasks.notifiedAt),
          lte(prospectTasks.notifyAt, at),
        ),
      )
      .orderBy(asc(prospectTasks.notifyAt))
      .limit(limit)
      .all();
    return Promise.all(
      rows.map(async (row) => ({
        taskId: row.taskId,
        kind: row.kind,
        notify: row.notify,
        dueAt: row.dueAt,
        company: { id: row.companyId, name: row.companyName, city: row.companyCity },
        contactName:
          row.contactLastName === null
            ? null
            : contactNameOf({ firstName: row.contactFirstName, lastName: row.contactLastName }),
        phone: row.contactMobile ?? row.contactPhone ?? row.companyPhone,
        lastNote: await lastNoteOf(database, row.companyId),
        interest: row.interest,
        teamSize: row.teamSize,
        toolKind: row.toolKind,
        recipient: row.reminderAddress ?? row.ownerEmail,
      })),
    );
  },
  markNotified: async (taskId, at) => {
    await database
      .update(prospectTasks)
      .set({ notifiedAt: at })
      .where(and(eq(prospectTasks.id, taskId), isNull(prospectTasks.notifiedAt)));
  },
});
