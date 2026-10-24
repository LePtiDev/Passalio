import { err, ok } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { ServiceRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import { refreshServices, saveServices } from "./services-store";

const serviceOf = (id: string, overrides: Partial<ServiceRecord> = {}): ServiceRecord => ({
  id,
  name: `Prestation ${id}`,
  durationMinutes: 60,
  priceCents: 8000,
  document: "none",
  trade: null,
  ...overrides,
});

let database: LocalDatabase;

const storedServices = async () =>
  (await database.services.toArray()).toSorted((left, right) => left.id.localeCompare(right.id));

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("saveServices", () => {
  it("keeps the services on the device", async () => {
    await saveServices(database, [serviceOf("a"), serviceOf("b", { priceCents: null })]);
    expect(await storedServices()).toEqual([serviceOf("a"), serviceOf("b", { priceCents: null })]);
  });

  it("replaces the previous list and forgets the services removed since", async () => {
    await saveServices(database, [serviceOf("a"), serviceOf("b")]);
    await saveServices(database, [serviceOf("b", { name: "Renommée" }), serviceOf("c")]);
    expect(await storedServices()).toEqual([serviceOf("b", { name: "Renommée" }), serviceOf("c")]);
  });

  it("empties the list when the company has no service left", async () => {
    await saveServices(database, [serviceOf("a")]);
    await saveServices(database, []);
    expect(await storedServices()).toEqual([]);
  });
});

describe("refreshServices", () => {
  it("stores the services received from the server and returns them", async () => {
    const services = [serviceOf("a"), serviceOf("b")];
    const result = await refreshServices(database, async () => ok({ services }));
    expect(result).toEqual({ isOk: true, value: { services } });
    expect(await storedServices()).toEqual(services);
  });

  it("keeps the services on the device when the server cannot be reached", async () => {
    await saveServices(database, [serviceOf("a")]);
    const result = await refreshServices(database, async () =>
      err({ code: "network", traceId: null }),
    );
    expect(result).toEqual({ isOk: false, error: { code: "network", traceId: null } });
    expect(await storedServices()).toEqual([serviceOf("a")]);
  });
});
