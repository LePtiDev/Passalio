import {
  assertPlatformCan,
  type ContactFilter,
  type PlatformActor,
  type ProspectContactsPageResponse,
} from "@passalio/shared";
import type { SalesDependencies } from "../domain/prospect-ports";
import { contactNameOf } from "../domain/prospect-rules";
import { decodeNameCursor, pageOf } from "./prospect-cursors";

export const CONTACTS_PAGE_SIZE = 50;

export type ListContactsInput = {
  readonly filter: ContactFilter;
  readonly department?: string | undefined;
  readonly query?: string | undefined;
  readonly cursor?: string | undefined;
};

export const listContacts =
  ({ contacts }: Pick<SalesDependencies, "contacts">) =>
  async (actor: PlatformActor, input: ListContactsInput): Promise<ProspectContactsPageResponse> => {
    assertPlatformCan(actor, "prospects:read");
    const query = input.query?.trim();
    const [rows, counts] = await Promise.all([
      contacts.list({
        filter: input.filter,
        department: input.department,
        query: query === "" ? undefined : query,
        after: decodeNameCursor(input.cursor),
        limit: CONTACTS_PAGE_SIZE + 1,
      }),
      contacts.counts(input.department),
    ]);
    const { visible, nextCursor } = pageOf(rows, CONTACTS_PAGE_SIZE);
    return {
      contacts: visible.map((row) => ({
        id: row.id,
        name: contactNameOf(row),
        jobTitle: row.jobTitle,
        isLeader: row.isLeader,
        phone: row.phone,
        email: row.email,
        company: row.company,
      })),
      counts,
      nextCursor,
    };
  };
