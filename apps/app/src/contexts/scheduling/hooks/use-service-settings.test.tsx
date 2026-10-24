import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { err, ok, type Actor, type OrganizationRole } from "@passalio/shared";
import type { ServiceChanges, ServiceFields } from "@passalio/trades";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResult } from "@/lib/api-client";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { LocalSession } from "@/lib/db/local-database-context";
import type { ServiceRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import { schedulingFr } from "../fr";
import { defaultServicesOf, useServiceSettings } from "./use-service-settings";

type ServerCall =
  | { readonly kind: "create"; readonly fields: ServiceFields }
  | { readonly kind: "update"; readonly serviceId: string; readonly changes: ServiceChanges }
  | { readonly kind: "archive"; readonly serviceId: string };

type TestContext = {
  session: LocalSession | undefined;
  actor: Actor | undefined;
  services: ServiceRecord[];
  failure: ApiResult<never> | undefined;
  calls: ServerCall[];
  toasts: string[];
};

const context = vi.hoisted(() => {
  const initial: TestContext = {
    session: undefined,
    actor: undefined,
    services: [],
    failure: undefined,
    calls: [],
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

vi.mock("../services-api", () => ({
  servicesApi: {
    fetchServices: async () => context.failure ?? ok({ services: [...context.services] }),
    createService: async (fields: ServiceFields) => {
      context.calls.push({ kind: "create", fields });
      if (context.failure !== undefined) {
        return context.failure;
      }
      const service = { ...fields, id: `service-${context.services.length + 1}` };
      context.services.push(service);
      return ok({ service });
    },
    updateService: async (serviceId: string, changes: ServiceFields) => {
      context.calls.push({ kind: "update", serviceId, changes });
      if (context.failure !== undefined) {
        return context.failure;
      }
      context.services = context.services.map((service) =>
        service.id === serviceId ? { ...service, ...changes } : service,
      );
      return ok({ service: context.services.find(({ id }) => id === serviceId) });
    },
    archiveService: async (serviceId: string) => {
      context.calls.push({ kind: "archive", serviceId });
      if (context.failure !== undefined) {
        return context.failure;
      }
      context.services = context.services.filter(({ id }) => id !== serviceId);
      return ok(undefined);
    },
  },
}));

type Settings = ReturnType<typeof useServiceSettings>;

const SWEEPING: ServiceRecord = {
  id: "service-sweeping",
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
  document: "chimney_sweeping_certificate",
  trade: "chimney_sweeping",
};

const RELINING: ServiceRecord = {
  id: "service-relining",
  name: "Tubage",
  durationMinutes: 2880,
  priceCents: null,
  document: "none",
  trade: null,
};

const NEW_FIELDS: ServiceFields = {
  name: "Débistrage",
  durationMinutes: 120,
  priceCents: 15000,
  document: "none",
  trade: null,
};

let database: LocalDatabase;
let root: Root;
let latest: Settings | undefined;

const rememberSettings = (settings: Settings) => {
  latest = settings;
};

const Probe = ({ onSettings }: { readonly onSettings: (settings: Settings) => void }) => {
  onSettings(useServiceSettings());
  return null;
};

const current = (): Settings => {
  if (latest === undefined) {
    throw new Error("not rendered");
  }
  return latest;
};

const render = async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Probe onSettings={rememberSettings} />
      </QueryClientProvider>,
    );
  });
};

const renderLoaded = async () => {
  await render();
  await vi.waitFor(() => expect(current().query.isSuccess).toBe(true));
};

const signIn = (role: OrganizationRole, isImpersonating = false) => {
  context.actor = { userId: "user-1", organizationId: "organization-a", role, isImpersonating };
};

const storedServices = async () =>
  (await database.services.toArray()).toSorted((left, right) => left.id.localeCompare(right.id));

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  latest = undefined;
  context.services = [SWEEPING, RELINING];
  context.failure = undefined;
  context.calls = [];
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

describe("defaultServicesOf", () => {
  it("proposes one service per trade, named after the trade, on quotation", () => {
    expect(defaultServicesOf(["chimney_sweeping", "septic_tank_emptying"])).toEqual([
      {
        name: "Ramonage",
        durationMinutes: 60,
        priceCents: null,
        document: "chimney_sweeping_certificate",
        trade: "chimney_sweeping",
      },
      {
        name: "Vidange de fosse",
        durationMinutes: 120,
        priceCents: null,
        document: "none",
        trade: "septic_tank_emptying",
      },
    ]);
  });

  it("proposes nothing for a company without trade", () => {
    expect(defaultServicesOf([])).toEqual([]);
  });
});

describe("useServiceSettings permissions", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets the %s edit the services", async (role) => {
    signIn(role);
    await render();
    expect(current().canEdit).toBe(true);
  });

  it.each<OrganizationRole>(["secretary", "technician"])(
    "shows the services read-only to the %s",
    async (role) => {
      signIn(role);
      await render();
      expect(current().canEdit).toBe(false);
    },
  );

  it("shows the services read-only during an impersonation", async () => {
    signIn("owner", true);
    await render();
    expect(current().canEdit).toBe(false);
  });

  it("shows the services read-only while the role is unknown", async () => {
    context.actor = undefined;
    await render();
    expect(current().canEdit).toBe(false);
  });
});

describe("useServiceSettings loading", () => {
  it("lists the services in the company's order and keeps them on the device", async () => {
    signIn("secretary");
    await renderLoaded();
    expect(current().query.data).toEqual([SWEEPING, RELINING]);
    expect(await storedServices()).toEqual([RELINING, SWEEPING]);
  });

  it("returns an empty list for a company without services", async () => {
    signIn("owner");
    context.services = [];
    await renderLoaded();
    expect(current().query.data).toEqual([]);
  });

  it("reports a failed load with its trace id and keeps the services on the device", async () => {
    signIn("owner");
    await database.services.put(SWEEPING);
    context.failure = err({ code: "internal", traceId: "trace-load" });
    await render();
    await vi.waitFor(() => expect(current().query.isError).toBe(true));
    expect(current().query.error).toMatchObject({
      apiError: { code: "internal", traceId: "trace-load" },
    });
    expect(await storedServices()).toEqual([SWEEPING]);
  });
});

describe("useServiceSettings saving", () => {
  it("creates a service, confirms it and keeps it on the device", async () => {
    signIn("owner");
    await renderLoaded();
    await act(async () => {
      await current().save.mutateAsync({ serviceId: null, fields: NEW_FIELDS });
    });
    expect(context.calls).toEqual([{ kind: "create", fields: NEW_FIELDS }]);
    expect(context.toasts).toEqual([schedulingFr.services.created]);
    await vi.waitFor(() =>
      expect(current().query.data).toEqual([
        SWEEPING,
        RELINING,
        { ...NEW_FIELDS, id: "service-3" },
      ]),
    );
    expect(await storedServices()).toContainEqual({ ...NEW_FIELDS, id: "service-3" });
  });

  it("updates a service, confirms it and keeps the new price on the device", async () => {
    signIn("admin");
    await renderLoaded();
    const fields = { ...SWEEPING, priceCents: 9500 };
    await act(async () => {
      await current().save.mutateAsync({ serviceId: SWEEPING.id, fields });
    });
    expect(context.calls).toEqual([{ kind: "update", serviceId: SWEEPING.id, changes: fields }]);
    expect(context.toasts).toEqual([schedulingFr.services.saved]);
    await vi.waitFor(() =>
      expect(current().query.data).toEqual([{ ...SWEEPING, priceCents: 9500 }, RELINING]),
    );
    expect(await storedServices()).toContainEqual({ ...SWEEPING, priceCents: 9500 });
  });

  it("shows no toast and reports the trace id when the save fails", async () => {
    signIn("owner");
    await renderLoaded();
    context.failure = err({ code: "internal", traceId: "trace-save" });
    await act(async () => {
      await current()
        .save.mutateAsync({ serviceId: null, fields: NEW_FIELDS })
        .catch(() => undefined);
    });
    await vi.waitFor(() => expect(current().save.isError).toBe(true));
    expect(current().save.error).toMatchObject({
      apiError: { code: "internal", traceId: "trace-save" },
    });
    expect(context.toasts).toEqual([]);
    expect(await storedServices()).toEqual([RELINING, SWEEPING]);
  });
});

describe("useServiceSettings archiving", () => {
  it("archives a service, confirms it and removes it from the device", async () => {
    signIn("owner");
    await renderLoaded();
    await act(async () => {
      await current().archive.mutateAsync(RELINING.id);
    });
    expect(context.calls).toEqual([{ kind: "archive", serviceId: RELINING.id }]);
    expect(context.toasts).toEqual([schedulingFr.services.archived]);
    await vi.waitFor(() => expect(current().query.data).toEqual([SWEEPING]));
    expect(await storedServices()).toEqual([SWEEPING]);
  });

  it("keeps the service and shows no toast when the archive fails", async () => {
    signIn("owner");
    await renderLoaded();
    context.failure = err({ code: "not_found", traceId: "trace-archive" });
    await act(async () => {
      await current()
        .archive.mutateAsync(RELINING.id)
        .catch(() => undefined);
    });
    await vi.waitFor(() => expect(current().archive.isError).toBe(true));
    expect(current().archive.error).toMatchObject({
      apiError: { code: "not_found", traceId: "trace-archive" },
    });
    expect(context.toasts).toEqual([]);
    expect(await storedServices()).toEqual([RELINING, SWEEPING]);
  });
});

describe("useServiceSettings default services", () => {
  it("adds one service per trade in order, then confirms", async () => {
    signIn("owner");
    context.services = [];
    await renderLoaded();
    await act(async () => {
      await current().addDefaults.mutateAsync(["chimney_sweeping", "stove_maintenance"]);
    });
    expect(context.calls).toEqual(
      defaultServicesOf(["chimney_sweeping", "stove_maintenance"]).map((fields) => ({
        kind: "create",
        fields,
      })),
    );
    expect(context.toasts).toEqual([schedulingFr.services.defaultsAdded]);
    await vi.waitFor(() =>
      expect(current().query.data?.map(({ name }) => name)).toEqual([
        "Ramonage",
        "Entretien de poêle",
      ]),
    );
    expect(await storedServices()).toHaveLength(2);
  });

  it("stops at the first failure and shows no toast", async () => {
    signIn("owner");
    context.services = [];
    await renderLoaded();
    context.failure = err({ code: "network", traceId: null });
    await act(async () => {
      await current()
        .addDefaults.mutateAsync(["chimney_sweeping", "stove_maintenance"])
        .catch(() => undefined);
    });
    await vi.waitFor(() => expect(current().addDefaults.isError).toBe(true));
    expect(context.calls).toHaveLength(1);
    expect(context.toasts).toEqual([]);
  });
});
