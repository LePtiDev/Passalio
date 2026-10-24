import {
  prospectCalls,
  prospectCompanies,
  prospectContacts,
  prospectFollowUps,
  prospectTasks,
  users,
} from "@passalio/db";
import { and, asc, count, desc, eq, gt, gte, inArray, isNotNull, isNull, or } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { CallRepository, SeriesRequest } from "../domain/call-ports";
import { contactNameOf } from "../domain/prospect-rules";
import { mainContactsOf } from "./main-contacts";

const SERIES_STAGES = ["to_qualify", "qualified", "interested"] as const;
const NOT_REACHED = ["no_answer", "voicemail"] as const;

const seriesFilterOf = ({ department, target, after }: SeriesRequest) =>
  and(
    department === undefined ? undefined : eq(prospectCompanies.department, department),
    inArray(prospectCompanies.stage, [...SERIES_STAGES]),
    isNotNull(prospectCompanies.phone),
    target === "never_called"
      ? isNull(prospectFollowUps.lastCallAt)
      : inArray(prospectFollowUps.lastCallOutcome, [...NOT_REACHED]),
    after === undefined
      ? undefined
      : or(
          gt(prospectCompanies.searchName, after.searchName),
          and(
            eq(prospectCompanies.searchName, after.searchName),
            gt(prospectCompanies.id, after.id),
          ),
        ),
  );

export const createD1CallRepository = (database: Database): CallRepository => ({
  record: async (call, lastCall, task) => {
    const { companyId: _companyId, ...lastCallFields } = lastCall;
    await database.batch([
      database.insert(prospectCalls).values(call),
      database
        .insert(prospectFollowUps)
        .values({ ...lastCall, updatedAt: call.calledAt })
        .onConflictDoUpdate({
          target: prospectFollowUps.companyId,
          set: { ...lastCallFields, updatedAt: call.calledAt },
        }),
      ...(task === null ? [] : [database.insert(prospectTasks).values(task)]),
    ]);
  },
  ofCompany: async (companyId, limit) => {
    const rows = await database
      .select({
        call: prospectCalls,
        authorName: users.name,
        contactFirstName: prospectContacts.firstName,
        contactLastName: prospectContacts.lastName,
      })
      .from(prospectCalls)
      .leftJoin(users, eq(users.id, prospectCalls.authorUserId))
      .leftJoin(prospectContacts, eq(prospectContacts.id, prospectCalls.contactId))
      .where(eq(prospectCalls.companyId, companyId))
      .orderBy(desc(prospectCalls.calledAt), desc(prospectCalls.id))
      .limit(limit)
      .all();
    return rows.map(({ call, authorName, contactFirstName, contactLastName }) => ({
      ...call,
      author:
        call.authorUserId === null || authorName === null
          ? null
          : { id: call.authorUserId, name: authorName },
      contact:
        call.contactId === null || contactLastName === null
          ? null
          : {
              id: call.contactId,
              name: contactNameOf({ firstName: contactFirstName, lastName: contactLastName }),
            },
    }));
  },
  countByAuthorSince: async (authorUserId, since) =>
    (
      await database
        .select({ calls: count() })
        .from(prospectCalls)
        .where(
          and(eq(prospectCalls.authorUserId, authorUserId), gte(prospectCalls.calledAt, since)),
        )
        .get()
    )?.calls ?? 0,
  series: async (request) => {
    const rows = await database
      .select({
        id: prospectCompanies.id,
        name: prospectCompanies.name,
        searchName: prospectCompanies.searchName,
        city: prospectCompanies.city,
        department: prospectCompanies.department,
        phone: prospectCompanies.phone,
        stage: prospectCompanies.stage,
        lastCallAt: prospectFollowUps.lastCallAt,
        lastCallOutcome: prospectFollowUps.lastCallOutcome,
        interest: prospectFollowUps.interest,
      })
      .from(prospectCompanies)
      .leftJoin(prospectFollowUps, eq(prospectFollowUps.companyId, prospectCompanies.id))
      .where(seriesFilterOf(request))
      .orderBy(asc(prospectCompanies.searchName), asc(prospectCompanies.id))
      .limit(request.limit)
      .all();
    const mainContacts = await mainContactsOf(
      database,
      rows.map(({ id }) => id),
    );
    return rows.flatMap(({ phone, ...row }) =>
      phone === null ? [] : [{ ...row, phone, mainContact: mainContacts.get(row.id) ?? null }],
    );
  },
});
