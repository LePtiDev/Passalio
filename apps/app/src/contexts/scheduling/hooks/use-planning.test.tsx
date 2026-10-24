import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { ok, type OrganizationRole } from "@passalio/shared";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { LocalSession } from "@/lib/db/local-database-context";
import type { MemberRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import { serverInterventionRecord } from "@/lib/sync/planning-test-records";
import type { PlanningSearch } from "../planning-search";
import { usePlanning, type PlanningModel, type PlanningState } from "./use-planning";

type OnlineActor = {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
  readonly isImpersonating: boolean;
};

type TestContext = {
  session: LocalSession | undefined;
  onlineActor: OnlineActor | undefined;
  serverMembers: readonly MemberRecord[];
};

const context = vi.hoisted(() => {
  const initial: TestContext = { session: undefined, onlineActor: undefined, serverMembers: [] };
  return initial;
});

vi.mock("@/lib/db/local-database-context", () => ({
  useLocalSession: () => {
    if (context.session === undefined) {
      throw new Error("no session");
    }
    return context.session;
  },
}));

vi.mock("@/contexts/identity", () => ({
  useActor: () => ({ data: context.onlineActor }),
  identityApi: {
    fetchMembers: async () =>
      ok({
        members: context.serverMembers.map((member) => ({
          ...member,
          id: `membership-${member.userId}`,
          email: `${member.userId}@example.test`,
          joinedAt: new Date("2026-10-01T10:00:00Z"),
        })),
        nextCursor: null,
      }),
  },
}));

const ORGANIZATION_ID = "organization-a";
const TODAY = "2026-10-23";

const team: MemberRecord[] = [
  { userId: "user-owner", name: "Quentin Guerrier", role: "owner" },
  { userId: "user-admin", name: "Alice Durand", role: "admin" },
  { userId: "user-secretary", name: "Sophie Martin", role: "secretary" },
  { userId: "user-tech", name: "Bruno Petit", role: "technician" },
  { userId: "user-tech-2", name: "Zoé Roux", role: "technician" },
];

const roleOf = (userId: string): OrganizationRole =>
  team.find((member) => member.userId === userId)?.role ?? "technician";

let database: LocalDatabase;
let root: Root;
let latest: PlanningState | undefined;

const rememberState = (state: PlanningState) => {
  latest = state;
};

const Probe = ({
  search,
  onState,
}: {
  readonly search: PlanningSearch;
  readonly onState: (state: PlanningState) => void;
}) => {
  onState(usePlanning(search).state);
  return null;
};

const signIn = (userId: string, connection: "online" | "offline" = "online") => {
  context.session = { database, actor: { userId, organizationId: ORGANIZATION_ID } };
  context.onlineActor =
    connection === "online"
      ? { userId, organizationId: ORGANIZATION_ID, role: roleOf(userId), isImpersonating: false }
      : undefined;
};

const render = async (search: PlanningSearch = {}) => {
  await act(async () => {
    root.render(<Probe search={search} onState={rememberState} />);
  });
};

const readyModel = async (): Promise<PlanningModel> => {
  await vi.waitFor(() => expect(latest?.status).toBe("ready"));
  if (latest?.status !== "ready") {
    throw new Error("planning not ready");
  }
  return latest.model;
};

const visitIdsOf = (model: PlanningModel) => model.visits.map(({ id }) => id).toSorted();

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T08:00:00Z"));
  latest = undefined;
  context.serverMembers = team;
  database = createTestDatabase();
  await database.members.bulkPut(team);
  await database.syncState.put({ key: "lastSyncedAt", value: "2026-10-23T07:59:00.000Z" });
  await database.interventions.bulkPut([
    serverInterventionRecord("visit-owner", { technicianUserId: "user-owner", startTime: "08:30" }),
    serverInterventionRecord("visit-tech", {
      technicianUserId: "user-tech",
      startTime: "10:00",
      announcedPriceCents: 7500,
    }),
    serverInterventionRecord("visit-tech-2", {
      technicianUserId: "user-tech-2",
      startTime: "14:00",
      announcedPriceCents: 9000,
    }),
    serverInterventionRecord("visit-tech-tomorrow", {
      technicianUserId: "user-tech",
      scheduledDate: "2026-10-24",
    }),
    serverInterventionRecord("visit-tech-next-week", {
      technicianUserId: "user-tech",
      scheduledDate: "2026-10-26",
    }),
  ]);
  root = createRoot(document.createElement("div"));
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  vi.useRealTimers();
  await database.delete();
});

describe("usePlanning for a technician", () => {
  it("shows only the technician's own visits", async () => {
    signIn("user-tech");
    await render();
    const model = await readyModel();
    expect(model.canPlan).toBe(false);
    expect(model.isTeam).toBe(false);
    expect(model.selection).toEqual(["user-tech"]);
    expect(visitIdsOf(model)).toEqual(["visit-tech"]);
    expect(model.totalCents).toBe(7500);
  });

  it("ignores agendas of other technicians given in the URL", async () => {
    signIn("user-tech");
    await render({ agendas: "user-owner.user-tech-2" });
    const model = await readyModel();
    expect(model.selection).toEqual(["user-tech"]);
    expect(visitIdsOf(model)).toEqual(["visit-tech"]);
  });

  it("does not open another technician's visit from the URL", async () => {
    signIn("user-tech");
    await render({ passage: "visit-tech-2" });
    expect((await readyModel()).selectedVisit).toBeUndefined();
  });

  it("stays limited to its own visits offline, from the cached role", async () => {
    signIn("user-tech", "offline");
    await render();
    const model = await readyModel();
    expect(model.canPlan).toBe(false);
    expect(visitIdsOf(model)).toEqual(["visit-tech"]);
  });
});

describe.each(["user-owner", "user-admin", "user-secretary"])("usePlanning for %s", (userId) => {
  it("shows the whole team and can plan visits", async () => {
    signIn(userId);
    await render();
    const model = await readyModel();
    expect(model.canPlan).toBe(true);
    expect(model.isTeam).toBe(true);
    expect(model.selection.toSorted()).toEqual(team.map((member) => member.userId).toSorted());
    expect(visitIdsOf(model)).toEqual(["visit-owner", "visit-tech", "visit-tech-2"]);
    expect(model.totalCents).toBe(16500);
  });

  it("filters the agendas given in the URL", async () => {
    signIn(userId);
    await render({ agendas: "user-tech-2" });
    const model = await readyModel();
    expect(model.selection).toEqual(["user-tech-2"]);
    expect(model.shownTechnicians.map((technician) => technician.userId)).toEqual(["user-tech-2"]);
    expect(visitIdsOf(model)).toEqual(["visit-tech-2"]);
    expect(model.isTeam).toBe(false);
  });

  it("lists the current user first, in blue", async () => {
    signIn(userId);
    await render();
    const model = await readyModel();
    expect(model.technicians[0]?.userId).toBe(userId);
    const visit = model.visits.find(({ id }) => id === "visit-tech");
    expect(visit).toBeDefined();
    expect(visit === undefined ? undefined : model.colorOf(visit)).toBe(
      model.technicians.find((technician) => technician.userId === "user-tech")?.color,
    );
  });
});

describe("usePlanning while impersonating", () => {
  it("does not let the support plan visits", async () => {
    signIn("user-owner");
    context.onlineActor = {
      userId: "user-owner",
      organizationId: ORGANIZATION_ID,
      role: "owner",
      isImpersonating: true,
    };
    await render();
    expect((await readyModel()).canPlan).toBe(false);
  });
});

describe("usePlanning views", () => {
  it("opens today's day view by default", async () => {
    signIn("user-owner");
    await render();
    const model = await readyModel();
    expect(model).toMatchObject({ day: TODAY, today: TODAY, view: "jour", days: [TODAY] });
    expect(model.previousDay).toBe("2026-10-22");
    expect(model.nextDay).toBe("2026-10-24");
  });

  it("uses the Paris time as current time", async () => {
    signIn("user-owner");
    await render();
    expect((await readyModel()).nowMinutes).toBe(10 * 60);
  });

  it("shows the week from Monday to Sunday and moves by seven days", async () => {
    signIn("user-tech");
    await render({ vue: "semaine", jour: TODAY });
    const model = await readyModel();
    expect(model.days).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
    expect(visitIdsOf(model)).toEqual(["visit-tech", "visit-tech-tomorrow"]);
    expect(model.visitsOn("2026-10-24").map(({ id }) => id)).toEqual(["visit-tech-tomorrow"]);
    expect(model.previousDay).toBe("2026-10-16");
    expect(model.nextDay).toBe("2026-10-30");
  });

  it("opens the visit given in the URL", async () => {
    signIn("user-owner");
    await render({ passage: "visit-tech-2" });
    expect((await readyModel()).selectedVisit?.id).toBe("visit-tech-2");
  });

  it("widens the hour grid to fit an early visit", async () => {
    await database.interventions.put(
      serverInterventionRecord("visit-early", {
        technicianUserId: "user-tech",
        startTime: "06:30",
      }),
    );
    signIn("user-tech");
    await render();
    expect((await readyModel()).range).toEqual({ firstHour: 6, lastHour: 19 });
  });
});
