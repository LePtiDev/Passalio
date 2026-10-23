import { ForbiddenError, journalPageResponse, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import { PLATFORM_JOURNAL_ACTIONS } from "../domain/journal-actions";
import {
  createInMemoryBackofficeDependencies,
  createInMemoryBackofficeState,
  inMemoryJournalRow,
  type InMemoryBackofficeState,
} from "../infrastructure/in-memory-backoffice-read-model";
import {
  JOURNAL_PAGE_SIZE,
  listAccountJournal,
  listPlatformJournal,
  toJournalEntry,
} from "./list-journal";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryBackofficeState;
const dependencies = () => createInMemoryBackofficeDependencies(state, () => NOW);
const admin = platformActorWith("admin");

const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

const addEntries = (count: number, organizationId: string, action: string) => {
  Array.from({ length: count }, (_, index) =>
    state.journal.push(
      inMemoryJournalRow({
        id: `${organizationId}-${String(index).padStart(3, "0")}`,
        action,
        createdAt: minutesAgo(index + 1),
        organizationId,
        organizationName: `Name of ${organizationId}`,
      }),
    ),
  );
};

beforeEach(() => {
  state = createInMemoryBackofficeState();
});

describe("listPlatformJournal", () => {
  it.each<PlatformRole>(["superadmin", "admin"])("opens the journal to a %s", async (role) => {
    addEntries(1, "organization-a", "organization.created");
    const page = await listPlatformJournal(dependencies())(platformActorWith(role), {});
    expect(page.entries).toHaveLength(1);
  });

  it("refuses the sales role, which has no access to client accounts", async () => {
    await expect(
      listPlatformJournal(dependencies())(platformActorWith("sales"), {}),
    ).rejects.toThrow(ForbiddenError);
  });

  it("answers an empty page when nothing happened", async () => {
    expect(await listPlatformJournal(dependencies())(admin, {})).toEqual({
      entries: [],
      nextCursor: null,
    });
  });

  it("keeps only platform actions, newest first", async () => {
    addEntries(2, "organization-a", "organization.created");
    addEntries(2, "organization-b", "customer.archived");
    state.journal.push(
      inMemoryJournalRow({
        id: "role-change",
        action: "platform.role_changed",
        createdAt: NOW,
        actorName: "Quentin",
        targetName: "Antho",
        data: { from: "admin", to: "sales" },
      }),
    );
    const page = await listPlatformJournal(dependencies())(admin, {});
    expect(journalPageResponse.parse(page)).toEqual(page);
    expect(page.entries.map(({ id }) => id)).toEqual([
      "role-change",
      "organization-a-000",
      "organization-a-001",
    ]);
    expect(page.entries[0]).toEqual({
      id: "role-change",
      action: "platform.role_changed",
      createdAt: "2026-10-23T10:00:00.000Z",
      organization: null,
      actorName: "Quentin",
      impersonatorName: null,
      targetName: "Antho",
      data: { from: "admin", to: "sales" },
    });
  });

  it("covers every team, invitation and MCP movement", () => {
    expect(PLATFORM_JOURNAL_ACTIONS).toEqual(
      expect.arrayContaining([
        "platform.invitation_sent",
        "platform.invitation_resent",
        "platform.invitation_canceled",
        "platform.invitation_accepted",
        "platform.role_changed",
        "platform.role_revoked",
        "mcp.authorized",
        "mcp.revoked",
      ]),
    );
  });

  it("cuts the journal to 50 entries by default", async () => {
    addEntries(JOURNAL_PAGE_SIZE + 1, "organization-a", "organization.created");
    const page = await listPlatformJournal(dependencies())(admin, {});
    expect(JOURNAL_PAGE_SIZE).toBe(50);
    expect(page.entries).toHaveLength(50);
    expect(page.nextCursor).not.toBeNull();
  });

  it("walks through the journal page by page without gap or duplicate", async () => {
    addEntries(5, "organization-a", "organization.created");
    const first = await listPlatformJournal(dependencies())(admin, { limit: 2 });
    const second = await listPlatformJournal(dependencies())(admin, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    const third = await listPlatformJournal(dependencies())(admin, {
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect([...first.entries, ...second.entries, ...third.entries].map(({ id }) => id)).toEqual([
      "organization-a-000",
      "organization-a-001",
      "organization-a-002",
      "organization-a-003",
      "organization-a-004",
    ]);
    expect(third.nextCursor).toBeNull();
  });

  it("starts from the newest entry when the cursor is not readable", async () => {
    addEntries(2, "organization-a", "organization.created");
    const page = await listPlatformJournal(dependencies())(admin, { cursor: "not-a-date|id" });
    expect(page.entries.map(({ id }) => id)).toEqual(["organization-a-000", "organization-a-001"]);
  });
});

describe("listAccountJournal", () => {
  it.each<PlatformRole>(["superadmin", "admin"])(
    "opens the journal of an account to a %s",
    async (role) => {
      addEntries(1, "organization-a", "customer.archived");
      const page = await listAccountJournal(dependencies())(platformActorWith(role), {
        organizationId: "organization-a",
      });
      expect(page.entries).toHaveLength(1);
    },
  );

  it("refuses the sales role, which has no access to client accounts", async () => {
    await expect(
      listAccountJournal(dependencies())(platformActorWith("sales"), {
        organizationId: "organization-a",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("shows every action of this account and nothing from another account", async () => {
    addEntries(2, "organization-a", "customer.archived");
    addEntries(1, "organization-a", "member.role_changed");
    addEntries(3, "organization-b", "customer.archived");
    const page = await listAccountJournal(dependencies())(admin, {
      organizationId: "organization-a",
    });
    expect(page.entries.map(({ organization }) => organization?.id)).toEqual([
      "organization-a",
      "organization-a",
      "organization-a",
    ]);
    expect(page.entries.map(({ action }) => action).toSorted()).toEqual([
      "customer.archived",
      "customer.archived",
      "member.role_changed",
    ]);
  });

  it("pages through the journal of an account", async () => {
    addEntries(3, "organization-a", "customer.archived");
    const first = await listAccountJournal(dependencies())(admin, {
      organizationId: "organization-a",
      limit: 2,
    });
    const second = await listAccountJournal(dependencies())(admin, {
      organizationId: "organization-a",
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(first.entries.map(({ id }) => id)).toEqual(["organization-a-000", "organization-a-001"]);
    expect(second.entries.map(({ id }) => id)).toEqual(["organization-a-002"]);
    expect(second.nextCursor).toBeNull();
  });
});

describe("toJournalEntry", () => {
  it("shows no organization when the organization name is unknown", () => {
    expect(
      toJournalEntry(
        inMemoryJournalRow({
          id: "entry",
          action: "organization.created",
          createdAt: NOW,
          organizationId: "organization-deleted",
          organizationName: null,
        }),
      ).organization,
    ).toBeNull();
  });
});
