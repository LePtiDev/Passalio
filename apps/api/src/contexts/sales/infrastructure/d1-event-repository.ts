import { prospectContacts, prospectEvents, users } from "@passalio/db";
import { desc, eq, type SQL } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { EventRepository } from "../domain/prospect-ports";
import { contactNameOf } from "../domain/prospect-rules";

const eventsWhere = async (database: Database, condition: SQL, limit: number) => {
  const rows = await database
    .select({
      event: prospectEvents,
      authorName: users.name,
      contactFirstName: prospectContacts.firstName,
      contactLastName: prospectContacts.lastName,
    })
    .from(prospectEvents)
    .leftJoin(users, eq(users.id, prospectEvents.authorUserId))
    .leftJoin(prospectContacts, eq(prospectContacts.id, prospectEvents.contactId))
    .where(condition)
    .orderBy(desc(prospectEvents.createdAt), desc(prospectEvents.id))
    .limit(limit)
    .all();
  return rows.map(({ event, authorName, contactFirstName, contactLastName }) => ({
    ...event,
    authorName,
    contact:
      event.contactId === null || contactLastName === null
        ? null
        : {
            id: event.contactId,
            name: contactNameOf({ firstName: contactFirstName, lastName: contactLastName }),
          },
  }));
};

export const createD1EventRepository = (database: Database): EventRepository => ({
  add: async (event) => {
    await database.insert(prospectEvents).values(event);
  },
  ofCompany: async (companyId, limit) =>
    eventsWhere(database, eq(prospectEvents.companyId, companyId), limit),
  ofContact: async (contactId, limit) =>
    eventsWhere(database, eq(prospectEvents.contactId, contactId), limit),
});
