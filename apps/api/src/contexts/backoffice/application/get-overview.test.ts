import { ForbiddenError, overviewResponse, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryBackofficeDependencies,
  createInMemoryBackofficeState,
  inMemoryAccount,
  inMemoryJournalRow,
  type InMemoryBackofficeState,
} from "../infrastructure/in-memory-backoffice-read-model";
import { ENDING_SOON_DAYS, getOverview, OVERVIEW_LIST_SIZE } from "./get-overview";

const NOW = new Date("2026-10-23T10:00:00Z");
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_IN_MS);

let state: InMemoryBackofficeState;
const run = () => getOverview(createInMemoryBackofficeDependencies(state, () => NOW));
const admin = platformActorWith("admin");

beforeEach(() => {
  state = createInMemoryBackofficeState();
});

describe("getOverview", () => {
  it.each<PlatformRole>(["superadmin", "admin"])("opens the overview to a %s", async (role) => {
    const overview = await run()(platformActorWith(role));
    expect(overviewResponse.parse(overview)).toEqual(overview);
  });

  it("refuses the sales role, which has no access to client accounts", async () => {
    await expect(run()(platformActorWith("sales"))).rejects.toThrow(ForbiddenError);
  });

  it("gives empty lists and zero counts on a new platform", async () => {
    expect(await run()(admin)).toEqual({
      counts: { all: 0, trial: 0, dropping: 0, endingSoon: 0, activePeople: 0 },
      dropping: [],
      endingTrials: [],
      movements: [],
    });
  });

  it("counts accounts, trials, drops, trials ending within a week and active people", async () => {
    state.activePeople = 7;
    state.accounts.push(
      inMemoryAccount({ id: "organization-new", name: "New", createdAt: daysAgo(1) }),
      inMemoryAccount({ id: "organization-ending", name: "Ending", createdAt: daysAgo(4) }),
      inMemoryAccount({
        id: "organization-drop",
        name: "Drop",
        createdAt: daysAgo(60),
        recent: 1,
        previous: 10,
      }),
    );
    expect((await run()(admin)).counts).toEqual({
      all: 3,
      trial: 2,
      dropping: 1,
      endingSoon: 2,
      activePeople: 7,
    });
  });

  it("lists the trials that end within seven days, the closest end first", async () => {
    expect(ENDING_SOON_DAYS).toBe(7);
    state.accounts.push(
      inMemoryAccount({ id: "organization-1", name: "One day", createdAt: daysAgo(1) }),
      inMemoryAccount({ id: "organization-6", name: "Six days", createdAt: daysAgo(6) }),
      inMemoryAccount({ id: "organization-3", name: "Three days", createdAt: daysAgo(3) }),
      inMemoryAccount({ id: "organization-8", name: "Trial over", createdAt: daysAgo(8) }),
    );
    expect((await run()(admin)).endingTrials.map(({ id }) => id)).toEqual([
      "organization-6",
      "organization-3",
      "organization-1",
    ]);
  });

  it("shows at most five ending trials but counts all of them", async () => {
    Array.from({ length: OVERVIEW_LIST_SIZE + 2 }, (_, index) =>
      state.accounts.push(
        inMemoryAccount({
          id: `organization-${index}`,
          name: `Ending ${index}`,
          createdAt: daysAgo(1 + index * 0.5),
        }),
      ),
    );
    const overview = await run()(admin);
    expect(overview.endingTrials).toHaveLength(5);
    expect(overview.counts.endingSoon).toBe(7);
  });

  it("lists the five worst drops, the steepest first", async () => {
    const drops: readonly (readonly [string, number])[] = [
      ["organization-25", 15],
      ["organization-100", 0],
      ["organization-50", 10],
      ["organization-90", 2],
      ["organization-75", 5],
      ["organization-30", 14],
      ["organization-80", 4],
    ];
    drops.forEach(([id, recent]) =>
      state.accounts.push(
        inMemoryAccount({ id, name: id, createdAt: daysAgo(90), recent, previous: 20 }),
      ),
    );
    state.accounts.push(
      inMemoryAccount({
        id: "organization-steady",
        name: "Steady",
        createdAt: daysAgo(90),
        recent: 20,
        previous: 20,
      }),
    );
    const overview = await run()(admin);
    expect(overview.dropping.map(({ id }) => id)).toEqual([
      "organization-100",
      "organization-90",
      "organization-80",
      "organization-75",
      "organization-50",
    ]);
    expect(overview.dropping[0]?.trend).toEqual({
      recent: 0,
      previous: 20,
      changePercent: -100,
      isDropping: true,
    });
  });

  it("shows the five latest platform movements and nothing from client activity", async () => {
    Array.from({ length: 6 }, (_, index) =>
      state.journal.push(
        inMemoryJournalRow({
          id: `entry-${index}`,
          action: "organization.created",
          createdAt: new Date(NOW.getTime() - (index + 1) * 60_000),
          organizationId: `organization-${index}`,
          organizationName: `Ramonage ${index}`,
          actorName: "Jean",
        }),
      ),
    );
    state.journal.push(
      inMemoryJournalRow({
        id: "entry-client",
        action: "customer.archived",
        createdAt: NOW,
        organizationId: "organization-0",
        organizationName: "Ramonage 0",
      }),
    );
    const { movements } = await run()(admin);
    expect(movements.map(({ id }) => id)).toEqual([
      "entry-0",
      "entry-1",
      "entry-2",
      "entry-3",
      "entry-4",
    ]);
    expect(movements[0]).toEqual({
      id: "entry-0",
      action: "organization.created",
      createdAt: "2026-10-23T09:59:00.000Z",
      organization: { id: "organization-0", name: "Ramonage 0" },
      actorName: "Jean",
      impersonatorName: null,
      targetName: null,
      data: null,
    });
  });
});
