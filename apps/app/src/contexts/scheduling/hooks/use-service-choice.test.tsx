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
import type { EquipmentRecord, ServiceRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import { serverEquipmentRecord } from "@/lib/sync/sync-test-records";
import { formatEuros, schedulingFr } from "../fr";
import { visitFormSchema, type VisitFormValues } from "../visit-form-schema";
import { useServiceChoice } from "./use-service-choice";

type ServerAnswer =
  | { readonly isOk: true; readonly value: { readonly services: ServiceRecord[] } }
  | { readonly isOk: false; readonly error: { code: string; traceId: string | null } };

const context = vi.hoisted(() => {
  const initial: { session: LocalSession | undefined; server: ServerAnswer | undefined } = {
    session: undefined,
    server: undefined,
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

vi.mock("../services-api", () => ({
  servicesApi: {
    fetchServices: async () => context.server ?? err({ code: "network", traceId: null }),
  },
}));

type Choice = ReturnType<typeof useServiceChoice>;

type Snapshot = { readonly choice: Choice; readonly form: UseFormReturn<VisitFormValues> };

const serviceOf = (id: string, overrides: Partial<ServiceRecord>): ServiceRecord => ({
  id,
  name: id,
  durationMinutes: 60,
  priceCents: null,
  document: "none",
  trade: null,
  ...overrides,
});

const SWEEPING = serviceOf("0190f3a0-0000-7000-8000-000000000501", {
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
  trade: "chimney_sweeping",
});
const STOVE = serviceOf("0190f3a0-0000-7000-8000-000000000502", {
  name: "Entretien poêle",
  durationMinutes: 90,
  priceCents: 11000,
  trade: "stove_maintenance",
});
const BOILER = serviceOf("0190f3a0-0000-7000-8000-000000000503", {
  name: "Entretien chaudière",
  durationMinutes: 60,
  priceCents: null,
  trade: "boiler_maintenance",
});
const HEAT_PUMP = serviceOf("0190f3a0-0000-7000-8000-000000000504", {
  name: "Entretien PAC",
  durationMinutes: 120,
  priceCents: 15000,
  trade: "heat_pump_maintenance",
});
const RELINING = serviceOf("0190f3a0-0000-7000-8000-000000000505", {
  name: "Tubage",
  durationMinutes: 2880,
});

const OFFERED = [SWEEPING, STOVE, BOILER, HEAT_PUMP, RELINING];

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

const euros = (cents: number) => formatEuros(cents);

let database: LocalDatabase;
let root: Root;
let latest: Snapshot | undefined;

const rememberSnapshot = (snapshot: Snapshot) => {
  latest = snapshot;
};

const Probe = ({
  equipmentIds,
  onSnapshot,
}: {
  readonly equipmentIds: readonly string[];
  readonly onSnapshot: (snapshot: Snapshot) => void;
}) => {
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: { ...STARTING_VALUES, equipmentIds: [...equipmentIds] },
  });
  onSnapshot({ choice: useServiceChoice(form, EQUIPMENTS), form });
  return null;
};

const render = async (equipmentIds: readonly string[] = []) => {
  await act(async () => {
    root.render(<Probe equipmentIds={equipmentIds} onSnapshot={rememberSnapshot} />);
  });
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

const priceField = () => current().form.getValues("price");

const checkEquipments = async (equipmentIds: string[]) => {
  await act(async () => {
    current().form.setValue("equipmentIds", equipmentIds);
  });
};

const typePrice = async (price: string) => {
  await act(async () => {
    current().form.setValue("price", price);
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

describe("useServiceChoice preselection", () => {
  it("chooses a service for the main trade of each checked equipment", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove", "heat-pump"]);
    await settled((choice) => {
      expect(choice.chosenIds).toEqual([SWEEPING.id, HEAT_PUMP.id]);
      expect(choice.chosen).toEqual([SWEEPING, HEAT_PUMP]);
      expect(choice.durationMinutes).toBe(180);
    });
  });

  it("fills the announced price with the sum of the services", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove", "heat-pump"]);
    await settled((choice) => expect(choice.chosenIds).toHaveLength(2));
    expect(priceField()).toBe(euros(23000));
  });

  it("freezes the chosen services as visit lines with their trades", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    expect(current().form.getValues("serviceLines")).toEqual([
      { serviceId: SWEEPING.id, name: "Ramonage", durationMinutes: 60, priceCents: 8000 },
    ]);
    expect(current().form.getValues("visitTypes")).toEqual(["chimney_sweeping"]);
  });

  it("follows the equipments checked afterwards", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await checkEquipments(["stove", "boiler"]);
    await settled((choice) => {
      expect(choice.chosenIds).toEqual([SWEEPING.id, BOILER.id]);
      expect(choice.durationMinutes).toBe(120);
    });
    expect(priceField()).toBe(euros(8000));
  });

  it("chooses the only service of the company when no equipment is checked", async () => {
    await database.services.bulkPut([STOVE]);
    await render();
    await settled((choice) => {
      expect(choice.offered).toEqual([STOVE]);
      expect(choice.chosenIds).toEqual([STOVE.id]);
      expect(choice.durationMinutes).toBe(90);
    });
    expect(priceField()).toBe(euros(11000));
  });

  it("chooses nothing without equipment when the company has several services", async () => {
    await database.services.bulkPut(OFFERED);
    await render();
    await settled((choice) => expect(choice.offered).toHaveLength(5));
    expect(current().choice.chosenIds).toEqual([]);
    expect(current().choice.durationMinutes).toBe(60);
    expect(priceField()).toBe("");
  });

  it("leaves the price empty when every chosen service is on quotation", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["boiler"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([BOILER.id]));
    expect(priceField()).toBe("");
  });
});

describe("useServiceChoice by hand", () => {
  it("fills the duration and the price with the services chosen by hand", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await act(async () => {
      current().choice.chooseServices([SWEEPING.id, STOVE.id]);
    });
    await settled((choice) => {
      expect(choice.chosenIds).toEqual([SWEEPING.id, STOVE.id]);
      expect(choice.durationMinutes).toBe(150);
    });
    expect(priceField()).toBe(euros(19000));
  });

  it("counts a service of several days as 8 hours", async () => {
    await database.services.bulkPut(OFFERED);
    await render();
    await settled((choice) => expect(choice.offered).toHaveLength(5));
    await act(async () => {
      current().choice.chooseServices([RELINING.id, STOVE.id]);
    });
    await settled((choice) => expect(choice.durationMinutes).toBe(480));
  });

  it("stops the automatic preselection once services are chosen by hand", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await act(async () => {
      current().choice.chooseServices([RELINING.id]);
    });
    await checkEquipments(["stove", "boiler"]);
    await settled((choice) => {
      expect(choice.chosenIds).toEqual([RELINING.id]);
      expect(choice.durationMinutes).toBe(480);
    });
  });

  it("keeps a price typed by hand when the services change", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await typePrice("95");
    await act(async () => {
      current().choice.chooseServices([SWEEPING.id, STOVE.id]);
    });
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id, STOVE.id]));
    expect(priceField()).toBe("95");
  });

  it("keeps a price typed by hand when the equipments change", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await typePrice("95");
    await checkEquipments(["stove", "heat-pump"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id, HEAT_PUMP.id]));
    expect(priceField()).toBe("95");
  });

  it("replaces a price it filled itself when the services change", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    expect(priceField()).toBe(euros(8000));
    await act(async () => {
      current().choice.chooseServices([STOVE.id]);
    });
    await settled((choice) => expect(choice.chosenIds).toEqual([STOVE.id]));
    expect(priceField()).toBe(euros(11000));
  });

  it("keeps a duration changed by hand next to the usual one", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await act(async () => {
      current().choice.chooseDuration(105);
    });
    await settled((choice) => {
      expect(choice.durationMinutes).toBe(105);
      expect(choice.chosen).toEqual([SWEEPING]);
    });
  });
});

describe("useServiceChoice required service", () => {
  it("refuses to save without service when the company has services", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["stove"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([SWEEPING.id]));
    await act(async () => {
      current().choice.chooseServices([]);
    });
    expect(await submit()).toBeUndefined();
    await settled((choice) => expect(choice.error).toBe(schedulingFr.form.errors.services));
  });

  it("saves the chosen service lines, duration and price", async () => {
    await database.services.bulkPut(OFFERED);
    await render(["heat-pump"]);
    await settled((choice) => expect(choice.chosenIds).toEqual([HEAT_PUMP.id]));
    expect(await submit()).toMatchObject({
      serviceLines: [
        { serviceId: HEAT_PUMP.id, name: "Entretien PAC", durationMinutes: 120, priceCents: 15000 },
      ],
      visitTypes: ["heat_pump_maintenance"],
      durationMinutes: 120,
      price: euros(15000),
    });
  });
});

describe("useServiceChoice without known services", () => {
  it("offers no service and saves the visit without service, for 1 hour", async () => {
    await render(["stove"]);
    await settled((choice) => {
      expect(choice.offered).toEqual([]);
      expect(choice.chosenIds).toEqual([]);
      expect(choice.durationMinutes).toBe(60);
    });
    const submitted = await submit();
    expect(submitted?.durationMinutes).toBe(60);
    expect(submitted?.serviceLines).toBeUndefined();
  });

  it("loads the services from the server when none are stored yet", async () => {
    context.server = ok({ services: [SWEEPING, STOVE] });
    await render(["stove"]);
    await settled((choice) => {
      expect(choice.chosenIds).toEqual([SWEEPING.id]);
      expect(choice.durationMinutes).toBe(60);
    });
    expect(await database.services.toArray()).toEqual([SWEEPING, STOVE]);
  });
});
