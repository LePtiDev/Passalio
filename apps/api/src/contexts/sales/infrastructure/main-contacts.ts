import { prospectContacts } from "@passalio/db";
import { asc, desc, inArray } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { Person } from "../domain/prospect-models";
import { contactNameOf } from "../domain/prospect-rules";

export const mainContactsOf = async (
  database: Database,
  companyIds: readonly string[],
): Promise<ReadonlyMap<string, Person>> => {
  if (companyIds.length === 0) {
    return new Map();
  }
  const rows = await database
    .select({
      id: prospectContacts.id,
      companyId: prospectContacts.companyId,
      firstName: prospectContacts.firstName,
      lastName: prospectContacts.lastName,
    })
    .from(prospectContacts)
    .where(inArray(prospectContacts.companyId, [...companyIds]))
    .orderBy(
      desc(prospectContacts.isMain),
      desc(prospectContacts.isLeader),
      asc(prospectContacts.createdAt),
    )
    .all();
  const contacts = new Map<string, Person>();
  for (const row of rows) {
    if (!contacts.has(row.companyId)) {
      contacts.set(row.companyId, { id: row.id, name: contactNameOf(row) });
    }
  }
  return contacts;
};
