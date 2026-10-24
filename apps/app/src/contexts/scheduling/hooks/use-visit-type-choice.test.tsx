import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { zodResolver } from "@hookform/resolvers/zod";
import { err, ok } from "@passalio/shared";
import type { EquipmentKind } from "@passalio/trades";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm, type UseFormReturn } from "react-hook-form";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { LocalSession } from "@/lib/db/local-database-context";
import type { EquipmentRecord, VisitTypeRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import { serverEquipmentRecord } from "@/lib/sync/sync-test-records";
import { schedulingFr } from "../fr";
import { visitFormSchema, type VisitFormValues } from "../visit-form-schema";
import type { VisitTypesResponse } from "../visit-types-api";
import { useVisitTypeChoice } from "./use-visit-type-choice";

type ServerAnswer =
  | { readonly isOk: true; readonly value: VisitTypesResponse }
  | { readonly isOk: false; readonly error: { code: string; traceId: string | null } };

const context = vi.hoisted(() => {
  const initial: {
    session: LocalSession | undefined;
    server: ServerAnswer | undefined;
    pending: Promise<void>;
  } = {
    session: undefined,
    server: undefined,
    pending: Promise.resolve(),
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

vi.mock("../visit-types-api", () => ({
  visitTypesApi: {
    fetchVisitTypes: async () => {
      await context.pending;
      return context.server ?? err({ code: "network", traceId: null });
    },
  },
}));

type Choice = ReturnType<typeof useVisitTypeChoice>;

type Snapshot = { readonly choice: Choice; readonly form: UseFormReturn<VisitFormValues> };

const DEFAULT_TYPES: VisitTypeRecord[] = [
  { type: "chimney_sweeping", minutes: 60 },
  { type: "stove_maintenance", minutes: 90 },
  { type: "boiler_maintenance", minutes: 60 },
  { type: "heat_pump_maintenance", minutes: 90 },
  { type: "septic_tank_emptying", minutes: 120 },
];

const equipmentOf = (id: string, kind: EquipmentKind): EquipmentRecord => ({
  ...serverEquipmentRecord(id, "site-1"),
  kind,
});

const EQUIPMENTS = [
  equipmentOf("stove", "log_stove"),
  equipmentOf("boiler", "boiler"),
  equipmentOf("heat-pump", "air_to_water_heat_pump"),
];

const STARTING_VALUES: VisitFormValues = {
  customerId: "customer-1",
  siteId: "site-1",
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  technicianUserId: "user-1",
  durationMinutes: 60,
  equipmentIds: [],
  price: "",
  notes: "",
};

let database: LocalDatabase;
let root: Root;
let latest: Snapshot | undefined;

const rememberSnapshot = (snapshot: Snapshot) => {
  latest = snapshot;
};

const Probe = ({
  equipments,
  equipmentIds,
  onSnapshot,
}: {
  readonly equipments: readonly EquipmentRecord[];
  readonly equipmentIds: readonly string[];
  readonly onSnapshot: (snapshot: Snapshot) => void;
}) => {
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: { ...STARTING_VALUES, equipmentIds: [...equipmentIds] },
  });
  onSnapshot({ choice: useVisitTypeChoice(form, equipments), form });
  return null;
};

const render = async (equipmentIds: readonly string[] = [], equipments = EQUIPMENTS) => {
  await act(async () => {
    root.render(
      <Probe equipments={equipments} equipmentIds={equipmentIds} onSnapshot={rememberSnapshot} />,
    );
  });
};

const NOT_YET_RESOLVED = () => undefined;

const deferred = () => {
  let resolve: () => void = NOT_YET_RESOLVED;
  const promise = new Promise<void>((settle) => {
    resolve = settle;
  });
  return { promise, resolve: () => resolve() };
};

const current = (): Snapshot => {
  if (latest === undefined) {
    throw new Error("not rendered");
  }
  return latest;
};

const settled = async (check: (choice: Choice) => void) => {
  await vi.waitFor(() => check(current().choice));
};

const checkEquipments = async (equipmentIds: string[]) => {
  await act(async () => {
    current().form.setValue("equipmentIds", equipmentIds);
  });
};

const submit = async () => {
  let submitted: VisitFormValues | undefined;
  await act(async () => {
    await current().form.handleSubmit((values) => {
      submitted = values;
    })();
  });
  return submitted;
};

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  latest = undefined;
  context.server = undefined;
  context.pending = Promise.resolve();
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

describe("useVisitTypeChoice preselection", () => {
  it("chooses the main trade of each checked equipment and adds their durations", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render(["stove", "heat-pump"]);
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["chimney_sweeping", "heat_pump_maintenance"]);
      expect(choice.durationMinutes).toBe(150);
    });
    expect(current().choice.chosen).toEqual([
      { type: "chimney_sweeping", minutes: 60 },
      { type: "heat_pump_maintenance", minutes: 90 },
    ]);
  });

  it("uses the company's own duration for the type", async () => {
    await database.visitTypes.bulkPut([{ type: "chimney_sweeping", minutes: 75 }]);
    await render(["stove"]);
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["chimney_sweeping"]);
      expect(choice.durationMinutes).toBe(75);
    });
  });

  it("follows the equipments checked afterwards", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenTypes).toEqual(["chimney_sweeping"]));
    await checkEquipments(["stove", "boiler"]);
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["chimney_sweeping", "boiler_maintenance"]);
      expect(choice.durationMinutes).toBe(120);
    });
  });

  it("chooses the only type of the company when no equipment is checked", async () => {
    await database.visitTypes.bulkPut([{ type: "chimney_sweeping", minutes: 60 }]);
    await render();
    await settled((choice) => {
      expect(choice.offered).toEqual([{ type: "chimney_sweeping", minutes: 60 }]);
      expect(choice.chosenTypes).toEqual(["chimney_sweeping"]);
      expect(choice.durationMinutes).toBe(60);
    });
  });

  it("offers the types in the trade catalog order", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES.toReversed());
    await render();
    await settled((choice) =>
      expect(choice.offered.map(({ type }) => type)).toEqual(DEFAULT_TYPES.map(({ type }) => type)),
    );
  });

  it("caps the duration at 8 hours", async () => {
    await database.visitTypes.bulkPut([
      { type: "chimney_sweeping", minutes: 300 },
      { type: "heat_pump_maintenance", minutes: 300 },
    ]);
    await render(["stove", "heat-pump"]);
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["chimney_sweeping", "heat_pump_maintenance"]);
      expect(choice.durationMinutes).toBe(480);
    });
  });
});

describe("useVisitTypeChoice by hand", () => {
  it("fills the duration with the types chosen by hand", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenTypes).toEqual(["chimney_sweeping"]));
    await act(async () => {
      current().choice.chooseTypes(["chimney_sweeping", "stove_maintenance"]);
    });
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["chimney_sweeping", "stove_maintenance"]);
      expect(choice.durationMinutes).toBe(150);
    });
  });

  it("stops the automatic preselection once types are chosen by hand", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenTypes).toEqual(["chimney_sweeping"]));
    await act(async () => {
      current().choice.chooseTypes(["septic_tank_emptying"]);
    });
    await checkEquipments(["stove", "boiler"]);
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["septic_tank_emptying"]);
      expect(choice.durationMinutes).toBe(120);
    });
  });

  it("keeps a duration changed by hand next to the usual one", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenTypes).toEqual(["chimney_sweeping"]));
    await act(async () => {
      current().choice.chooseDuration(105);
    });
    await settled((choice) => {
      expect(choice.durationMinutes).toBe(105);
      expect(choice.chosen).toEqual([{ type: "chimney_sweeping", minutes: 60 }]);
    });
  });

  it("keeps a duration changed by hand when the stored types are refreshed from the server", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    const answer = deferred();
    context.server = undefined;
    context.pending = answer.promise;
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenTypes).toEqual(["chimney_sweeping"]));
    await act(async () => {
      current().choice.chooseDuration(105);
    });
    await settled((choice) => expect(choice.durationMinutes).toBe(105));
    context.server = ok({ visitTypes: DEFAULT_TYPES });
    await act(async () => {
      answer.resolve();
      await answer.promise;
    });
    await vi.waitFor(async () => expect(await database.visitTypes.count()).toBe(5));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(current().choice.durationMinutes).toBe(105);
  });
});

describe("useVisitTypeChoice required type", () => {
  it("refuses to save without type when the company has types", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render();
    await settled((choice) => expect(choice.offered).toHaveLength(5));
    expect(current().choice.chosenTypes).toEqual([]);
    expect(await submit()).toBeUndefined();
    await settled((choice) => expect(choice.error).toBe(schedulingFr.form.errors.visitType));
  });

  it("saves the chosen types and duration", async () => {
    await database.visitTypes.bulkPut(DEFAULT_TYPES);
    await render(["boiler"]);
    await settled((choice) => expect(choice.chosenTypes).toEqual(["boiler_maintenance"]));
    expect(await submit()).toMatchObject({
      visitTypes: ["boiler_maintenance"],
      durationMinutes: 60,
    });
  });
});

describe("useVisitTypeChoice without known types", () => {
  it("offers no type and saves the visit without type, for 1 hour", async () => {
    context.server = err({ code: "network", traceId: null });
    await render(["stove"]);
    await settled((choice) => {
      expect(choice.offered).toEqual([]);
      expect(choice.chosenTypes).toEqual([]);
      expect(choice.durationMinutes).toBe(60);
    });
    const submitted = await submit();
    expect(submitted?.durationMinutes).toBe(60);
    expect(submitted?.visitTypes ?? []).toEqual([]);
  });

  it("loads the types from the server when none are stored yet", async () => {
    context.server = ok({ visitTypes: [{ type: "chimney_sweeping", minutes: 45 }] });
    await render(["stove"]);
    await settled((choice) => {
      expect(choice.chosenTypes).toEqual(["chimney_sweeping"]);
      expect(choice.durationMinutes).toBe(45);
    });
    expect(await database.visitTypes.toArray()).toEqual([
      { type: "chimney_sweeping", minutes: 45 },
    ]);
  });
});
