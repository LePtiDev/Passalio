import { err, ok } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MembersPage } from "@/contexts/identity/identity-api";
import type { LocalDatabase } from "@/lib/db/local-database";
import { createTestDatabase } from "@/lib/db/test-database";
import { refreshMembers, type FetchMembersPage } from "./members-store";

vi.mock("@/contexts/identity", () => ({ identityApi: {} }));

const teamMember = (userId: string, name: string): MembersPage["members"][number] => ({
  id: `membership-${userId}`,
  userId,
  name,
  email: `${userId}@example.test`,
  role: "technician",
  joinedAt: new Date("2026-10-01T10:00:00Z"),
});

const FIRST_PAGE: MembersPage = {
  members: [teamMember("user-1", "Alice Durand"), teamMember("user-2", "Bruno Petit")],
  nextCursor: "cursor-2",
};

const LAST_PAGE: MembersPage = {
  members: [teamMember("user-3", "Chloé Roux")],
  nextCursor: null,
};

const pagedFetch = () =>
  vi.fn<FetchMembersPage>(async (cursor) => ok(cursor === "cursor-2" ? LAST_PAGE : FIRST_PAGE));

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("refreshMembers", () => {
  it("fetches every page, 50 members at a time", async () => {
    const fetchPage = pagedFetch();
    const result = await refreshMembers(database, fetchPage);
    expect(fetchPage.mock.calls).toEqual([
      [null, 50],
      ["cursor-2", 50],
    ]);
    expect(result.isOk).toBe(true);
    expect((await database.members.toArray()).map(({ userId }) => userId).toSorted()).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
  });

  it("keeps only the user id, name and role in the cache", async () => {
    await refreshMembers(database, pagedFetch());
    expect(await database.members.get("user-3")).toEqual({
      userId: "user-3",
      name: "Chloé Roux",
      role: "technician",
    });
  });

  it("replaces the cache, dropping members who left", async () => {
    await database.members.put({ userId: "user-gone", name: "Ancien", role: "admin" });
    await refreshMembers(database, pagedFetch());
    expect(await database.members.get("user-gone")).toBeUndefined();
    expect(await database.members.count()).toBe(3);
  });

  it("keeps the cache when a page fails", async () => {
    await database.members.put({ userId: "user-kept", name: "Gardé", role: "owner" });
    const failure = { code: "network", traceId: null };
    const fetchPage = vi.fn<FetchMembersPage>(async (cursor) =>
      cursor === null ? ok(FIRST_PAGE) : err(failure),
    );
    const result = await refreshMembers(database, fetchPage);
    expect(result).toEqual({ isOk: false, error: failure });
    expect((await database.members.toArray()).map(({ userId }) => userId)).toEqual(["user-kept"]);
  });

  it("empties the cache when the team has no member left", async () => {
    await database.members.put({ userId: "user-gone", name: "Ancien", role: "admin" });
    await refreshMembers(
      database,
      vi.fn<FetchMembersPage>(async () => ok({ members: [], nextCursor: null })),
    );
    expect(await database.members.count()).toBe(0);
  });
});
