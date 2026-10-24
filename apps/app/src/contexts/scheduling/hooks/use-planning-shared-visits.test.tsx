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
    serverInterventionRecord("visit-shared", {
      technicianUserId: "user-tech",
      technicianUserIds: ["user-tech", "user-tech-2"],
      startTime: "10:00",
      announcedPriceCents: 12000,
    }),
    serverInterventionRecord("visit-tech-2", {
      technicianUserId: "user-tech-2",
      technicianUserIds: ["user-tech-2"],
      startTime: "14:00",
      announcedPriceCents: 9000,
    }),
    serverInterventionRecord("visit-owner-legacy", {
      technicianUserId: "user-owner",
      technicianUserIds: [],
      startTime: "08:30",
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

describe("usePlanning with a visit shared by two technicians", () => {
  it("shows the shared visit to the lead technician", async () => {
    signIn("user-tech");
    await render();
    expect(visitIdsOf(await readyModel())).toEqual(["visit-shared"]);
  });

  it("shows the shared visit to the second technician with his own visits", async () => {
    signIn("user-tech-2");
    await render();
    const model = await readyModel();
    expect(visitIdsOf(model)).toEqual(["visit-shared", "visit-tech-2"]);
    expect(model.totalCents).toBe(21000);
  });

  it("lets the second technician open the shared visit from the URL", async () => {
    signIn("user-tech-2");
    await render({ passage: "visit-shared" });
    expect((await readyModel()).selectedVisit?.id).toBe("visit-shared");
  });

  it("puts the shared visit in the column of each technician", async () => {
    signIn("user-owner");
    await render();
    const model = await readyModel();
    expect(model.visitsOf("user-tech").map(({ id }) => id)).toEqual(["visit-shared"]);
    expect(
      model
        .visitsOf("user-tech-2")
        .map(({ id }) => id)
        .toSorted(),
    ).toEqual(["visit-shared", "visit-tech-2"]);
  });

  it("counts the shared visit for each technician", async () => {
    signIn("user-owner");
    await render();
    const model = await readyModel();
    expect(model.visitCounts.get("user-tech")).toBe(1);
    expect(model.visitCounts.get("user-tech-2")).toBe(2);
    expect(model.visitCounts.get("user-owner")).toBe(1);
  });

  it("counts the price of the shared visit once in the day total", async () => {
    signIn("user-owner");
    await render();
    const model = await readyModel();
    expect(visitIdsOf(model)).toEqual(["visit-owner-legacy", "visit-shared", "visit-tech-2"]);
    expect(model.totalCents).toBe(21000);
  });

  it("keeps the shared visit when only the second technician's agenda is shown", async () => {
    signIn("user-owner");
    await render({ agendas: "user-tech-2" });
    expect(visitIdsOf(await readyModel())).toEqual(["visit-shared", "visit-tech-2"]);
  });

  it("colours the shared visit with the lead technician's colour", async () => {
    signIn("user-owner");
    await render();
    const model = await readyModel();
    const shared = model.visits.find(({ id }) => id === "visit-shared");
    expect(shared).toBeDefined();
    expect(shared === undefined ? undefined : model.colorOf(shared)).toBe(
      model.technicians.find((technician) => technician.userId === "user-tech")?.color,
    );
  });

  it("assigns a visit stored without a technician list to its lead", async () => {
    signIn("user-owner");
    await render({ agendas: "user-owner" });
    const model = await readyModel();
    expect(visitIdsOf(model)).toEqual(["visit-owner-legacy"]);
    expect(model.visitsOf("user-owner").map(({ id }) => id)).toEqual(["visit-owner-legacy"]);
  });
});
