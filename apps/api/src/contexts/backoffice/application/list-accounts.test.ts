import { accountsPageResponse, ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryBackofficeDependencies,
  createInMemoryBackofficeState,
  inMemoryAccount,
  inMemoryMember,
  type InMemoryBackofficeState,
} from "../infrastructure/in-memory-backoffice-read-model";
import { ACCOUNTS_PAGE_SIZE, listAccounts } from "./list-accounts";

const NOW = new Date("2026-10-23T10:00:00Z");
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_IN_MS);

let state: InMemoryBackofficeState;
const run = () => listAccounts(createInMemoryBackofficeDependencies(state, () => NOW));
const admin = platformActorWith("admin");

const addAccounts = (count: number) => {
  Array.from({ length: count }, (_, index) =>
    state.accounts.push(
      inMemoryAccount({
        id: `organization-${String(index).padStart(3, "0")}`,
        name: `Ramonage ${String(index).padStart(3, "0")}`,
        createdAt: daysAgo(100),
      }),
    ),
  );
};

beforeEach(() => {
  state = createInMemoryBackofficeState();
});

describe("listAccounts", () => {
  it.each<PlatformRole>(["superadmin", "admin"])("lets a %s list client accounts", async (role) => {
    addAccounts(1);
    const page = await run()(platformActorWith(role), { filter: "all" });
    expect(page.accounts.map(({ id }) => id)).toEqual(["organization-000"]);
  });

  it("refuses the sales role, which has no access to client accounts", async () => {
    await expect(run()(platformActorWith("sales"), { filter: "all" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("answers an empty page with zero counts when there is no account", async () => {
    expect(await run()(admin, { filter: "all" })).toEqual({
      accounts: [],
      counts: { all: 0, trial: 0, dropping: 0 },
      nextCursor: null,
    });
  });

  it("summarizes an account with its staff, six months of usage, trend and last activity", async () => {
    state.accounts.push(
      inMemoryAccount({
        id: "organization-a",
        name: "Ramonage A",
        address: "1 rue du Four, Paris",
        createdAt: new Date("2026-10-20T08:00:00Z"),
        recent: 6,
        previous: 10,
      }),
    );
    state.members.push(
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-jean",
        name: "Jean",
        role: "owner",
        lastActiveDay: "2026-10-21",
      }),
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-paul",
        name: "Paul",
        role: "technician",
        lastActiveDay: "2026-10-22",
      }),
      inMemoryMember({
        organizationId: "organization-b",
        userId: "user-other",
        name: "Other",
        role: "owner",
        lastActiveDay: "2026-10-23",
      }),
    );
    state.monthlyActivity.push(
      { organizationId: "organization-a", userId: "user-jean", month: "2026-10", activeDays: 4 },
      { organizationId: "organization-a", userId: "user-paul", month: "2026-10", activeDays: 2 },
      { organizationId: "organization-a", userId: "user-jean", month: "2026-09", activeDays: 10 },
      { organizationId: "organization-b", userId: "user-other", month: "2026-10", activeDays: 9 },
    );
    const page = await run()(admin, { filter: "all" });
    expect(accountsPageResponse.parse(page)).toEqual(page);
    expect(page.accounts).toEqual([
      {
        id: "organization-a",
        name: "Ramonage A",
        address: "1 rue du Four, Paris",
        createdAt: "2026-10-20T08:00:00.000Z",
        trialEndsAt: "2026-11-03T08:00:00.000Z",
        isInTrial: true,
        staffCount: 2,
        staff: [
          { id: "user-jean", name: "Jean", role: "owner" },
          { id: "user-paul", name: "Paul", role: "technician" },
        ],
        monthlyActivity: [
          { month: "2026-05", activeDays: 0 },
          { month: "2026-06", activeDays: 0 },
          { month: "2026-07", activeDays: 0 },
          { month: "2026-08", activeDays: 0 },
          { month: "2026-09", activeDays: 10 },
          { month: "2026-10", activeDays: 6 },
        ],
        trend: { recent: 6, previous: 10, changePercent: -40, isDropping: true },
        lastActive: { day: "2026-10-22", name: "Paul" },
      },
    ]);
  });

  it("has no last activity for an account nobody has used yet", async () => {
    state.accounts.push(
      inMemoryAccount({ id: "organization-a", name: "Ramonage A", createdAt: daysAgo(40) }),
    );
    state.members.push(
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-jean",
        name: "Jean",
        role: "owner",
      }),
    );
    const [account] = (await run()(admin, { filter: "all" })).accounts;
    expect(account?.lastActive).toBeNull();
    expect(account?.isInTrial).toBe(false);
  });

  it("cuts the list to 25 accounts by default and gives a cursor to the next page", async () => {
    addAccounts(ACCOUNTS_PAGE_SIZE + 1);
    const page = await run()(admin, { filter: "all" });
    expect(ACCOUNTS_PAGE_SIZE).toBe(25);
    expect(page.accounts).toHaveLength(25);
    expect(page.nextCursor).not.toBeNull();
  });

  it("walks through every account page by page without gap or duplicate", async () => {
    addAccounts(5);
    const first = await run()(admin, { filter: "all", limit: 2 });
    const second = await run()(admin, {
      filter: "all",
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    const third = await run()(admin, {
      filter: "all",
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect([...first.accounts, ...second.accounts, ...third.accounts].map(({ id }) => id)).toEqual([
      "organization-000",
      "organization-001",
      "organization-002",
      "organization-003",
      "organization-004",
    ]);
    expect(third.nextCursor).toBeNull();
  });

  it("gives no next cursor when the page is exactly full", async () => {
    addAccounts(2);
    expect((await run()(admin, { filter: "all", limit: 2 })).nextCursor).toBeNull();
  });

  it("starts from the first page when the cursor is not readable", async () => {
    addAccounts(2);
    const page = await run()(admin, { filter: "all", cursor: "garbage" });
    expect(page.accounts.map(({ id }) => id)).toEqual(["organization-000", "organization-001"]);
  });

  it("searches by name once the query is trimmed and ignores a blank query", async () => {
    state.accounts.push(
      inMemoryAccount({ id: "organization-a", name: "Ramonage Dupont", createdAt: daysAgo(40) }),
      inMemoryAccount({ id: "organization-b", name: "Cheminées du Val", createdAt: daysAgo(40) }),
    );
    const found = await run()(admin, { filter: "all", query: "  dupont  " });
    const blank = await run()(admin, { filter: "all", query: "   " });
    expect(found.accounts.map(({ id }) => id)).toEqual(["organization-a"]);
    expect(blank.accounts.map(({ id }) => id)).toEqual(["organization-b", "organization-a"]);
  });

  it("filters accounts in trial or dropping while counting every filter", async () => {
    state.accounts.push(
      inMemoryAccount({ id: "organization-trial", name: "A trial", createdAt: daysAgo(3) }),
      inMemoryAccount({
        id: "organization-drop",
        name: "B drop",
        createdAt: daysAgo(90),
        recent: 2,
        previous: 20,
      }),
      inMemoryAccount({
        id: "organization-steady",
        name: "C steady",
        createdAt: daysAgo(90),
        recent: 20,
        previous: 20,
      }),
    );
    const trial = await run()(admin, { filter: "trial" });
    const dropping = await run()(admin, { filter: "dropping" });
    expect(trial.accounts.map(({ id }) => id)).toEqual(["organization-trial"]);
    expect(dropping.accounts.map(({ id }) => id)).toEqual(["organization-drop"]);
    expect(trial.counts).toEqual({ all: 3, trial: 1, dropping: 1 });
    expect(dropping.counts).toEqual({ all: 3, trial: 1, dropping: 1 });
  });
});
