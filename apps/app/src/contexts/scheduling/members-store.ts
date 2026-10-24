import { ok, type Result } from "@passalio/shared";
import { identityApi } from "@/contexts/identity";
import type { ApiError } from "@/lib/api-client";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { MemberRecord } from "@/lib/db/local-records";

const MEMBERS_PAGE_SIZE = 50;

export type FetchMembersPage = typeof identityApi.fetchMembers;

const fetchAllMembers = async (
  fetchPage: FetchMembersPage,
  cursor: string | null,
  fetched: readonly MemberRecord[],
): Promise<Result<readonly MemberRecord[], ApiError>> => {
  const page = await fetchPage(cursor, MEMBERS_PAGE_SIZE);
  if (!page.isOk) {
    return page;
  }
  const members = [
    ...fetched,
    ...page.value.members.map(({ userId, name, role }) => ({ userId, name, role })),
  ];
  return page.value.nextCursor === null
    ? ok(members)
    : fetchAllMembers(fetchPage, page.value.nextCursor, members);
};

export const refreshMembers = async (
  database: LocalDatabase,
  fetchPage: FetchMembersPage = identityApi.fetchMembers,
) => {
  const members = await fetchAllMembers(fetchPage, null, []);
  if (members.isOk) {
    await database.transaction("rw", database.members, async () => {
      await database.members.clear();
      await database.members.bulkPut([...members.value]);
    });
  }
  return members;
};
