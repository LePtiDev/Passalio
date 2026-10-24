import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { err, ok, type Actor, type OrganizationRole } from "@passalio/shared";
import type { VisitDurations } from "@passalio/trades";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResult } from "@/lib/api-client";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { LocalSession } from "@/lib/db/local-database-context";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import { schedulingFr } from "../fr";
import type { VisitTypesResponse } from "../visit-types-api";
import { useVisitTypeSettings } from "./use-visit-type-settings";

type TestContext = {
  session: LocalSession | undefined;
  actor: Actor | undefined;
  fetched: ApiResult<VisitTypesResponse>;
  updated: ApiResult<VisitTypesResponse>;
  sentDurations: VisitDurations[];
  toasts: string[];
};

const context = vi.hoisted(() => {
  const initial: TestContext = {
    session: undefined,
    actor: undefined,
    fetched: { isOk: false, error: { code: "network", traceId: null } },
    updated: { isOk: false, error: { code: "network", traceId: null } },
    sentDurations: [],
    toasts: [],
  };
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
  useActor: () => ({ data: context.actor }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => {
      context.toasts.push(message);
    },
  },
}));

vi.mock("../visit-types-api", () => ({
  visitTypesApi: {
    fetchVisitTypes: async () => context.fetched,
    updateVisitDurations: async (durations: VisitDurations) => {
      context.sentDurations.push(durations);
      return context.updated;
    },
  },
}));

type Settings = ReturnType<typeof useVisitTypeSettings>;

const SERVER_TYPES: VisitTypeRecord[] = [
  { type: "boiler_maintenance", minutes: 60 },
  { type: "chimney_sweeping", minutes: 60 },
];

let database: LocalDatabase;
let root: Root;
let latest: Settings | undefined;

const rememberSettings = (settings: Settings) => {
  latest = settings;
};

const Probe = ({ onSettings }: { readonly onSettings: (settings: Settings) => void }) => {
  onSettings(useVisitTypeSettings());
  return null;
};

const current = (): Settings => {
  if (latest === undefined) {
    throw new Error("not rendered");
  }
  return latest;
};

const render = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Probe onSettings={rememberSettings} />
      </QueryClientProvider>,
    );
  });
};

const signIn = (role: OrganizationRole, isImpersonating = false) => {
  context.actor = { userId: "user-1", organizationId: "organization-a", role, isImpersonating };
};

const storedTypes = async () =>
  (await database.visitTypes.toArray()).toSorted((left, right) =>
    left.type.localeCompare(right.type),
  );

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  latest = undefined;
  context.fetched = ok({ visitTypes: SERVER_TYPES });
  context.updated = err({ code: "network", traceId: null });
  context.sentDurations = [];
  context.toasts = [];
  database = createTestDatabase();
  context.session = { database, actor: { userId: "user-1", organizationId: "organization-a" } };
  root = createRoot(document.createElement("div"));
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  await database.delete();
});

describe("useVisitTypeSettings permissions", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "lets the %s change the durations",
    async (role) => {
      signIn(role);
      await render();
      expect(current().canEdit).toBe(true);
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])(
    "shows the durations read-only to the %s",
    async (role) => {
      signIn(role);
      await render();
      expect(current().canEdit).toBe(false);
    },
  );

  it("shows the durations read-only during an impersonation", async () => {
    signIn("owner", true);
    await render();
    expect(current().canEdit).toBe(false);
  });

  it("shows the durations read-only while the role is unknown", async () => {
    context.actor = undefined;
    await render();
    expect(current().canEdit).toBe(false);
  });
});

describe("useVisitTypeSettings loading", () => {
  it("lists the types in trade order and keeps them on the device", async () => {
    signIn("owner");
    await render();
    await vi.waitFor(() =>
      expect(current().query.data).toEqual([
        { type: "chimney_sweeping", minutes: 60 },
        { type: "boiler_maintenance", minutes: 60 },
      ]),
    );
    expect(await storedTypes()).toEqual(SERVER_TYPES);
  });

  it("reports a failed load with its trace id", async () => {
    signIn("owner");
    context.fetched = err({ code: "internal", traceId: "trace-load" });
    await render();
    await vi.waitFor(() => expect(current().query.isError).toBe(true));
    expect(current().query.error).toMatchObject({
      apiError: { code: "internal", traceId: "trace-load" },
    });
  });
});

describe("useVisitTypeSettings saving", () => {
  it("sends only the changed duration, then confirms and keeps it on the device", async () => {
    signIn("owner");
    const saved: VisitTypeRecord[] = [
      { type: "boiler_maintenance", minutes: 60 },
      { type: "chimney_sweeping", minutes: 90 },
    ];
    context.updated = ok({ visitTypes: saved });
    await render();
    await vi.waitFor(() => expect(current().query.isSuccess).toBe(true));
    await act(async () => {
      await current().update.mutateAsync({ chimney_sweeping: 90 });
    });
    expect(context.sentDurations).toEqual([{ chimney_sweeping: 90 }]);
    expect(context.toasts).toEqual([schedulingFr.visitTypes.saved]);
    expect(await storedTypes()).toEqual(saved);
    await vi.waitFor(() =>
      expect(current().query.data).toEqual([
        { type: "chimney_sweeping", minutes: 90 },
        { type: "boiler_maintenance", minutes: 60 },
      ]),
    );
  });

  it("keeps the stored durations and shows no toast when the save fails", async () => {
    signIn("owner");
    context.updated = err({ code: "internal", traceId: "trace-save" });
    await render();
    await vi.waitFor(() => expect(current().query.isSuccess).toBe(true));
    await act(async () => {
      await current()
        .update.mutateAsync({ chimney_sweeping: 90 })
        .catch(() => undefined);
    });
    await vi.waitFor(() => expect(current().update.isError).toBe(true));
    expect(current().update.error).toMatchObject({
      apiError: { code: "internal", traceId: "trace-save" },
    });
    expect(context.toasts).toEqual([]);
    expect(await storedTypes()).toEqual(SERVER_TYPES);
  });
});
