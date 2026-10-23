import { err, ok } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { createTestDatabase } from "@/lib/db/test-database";
import type { FetchVisitTypes } from "./visit-types-api";
import { refreshVisitTypes, saveVisitTypes } from "./visit-types-store";

const SERVER_TYPES: VisitTypeRecord[] = [
  { type: "chimney_sweeping", minutes: 75 },
  { type: "stove_maintenance", minutes: 90 },
];

const storedTypes = async () =>
  (await database.visitTypes.toArray()).toSorted((left, right) =>
    left.type.localeCompare(right.type),
  );

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("saveVisitTypes", () => {
  it("stores each type with its duration, keyed by type", async () => {
    await saveVisitTypes(database, SERVER_TYPES);
    expect(await database.visitTypes.get("chimney_sweeping")).toEqual({
      type: "chimney_sweeping",
      minutes: 75,
    });
    expect(await database.visitTypes.count()).toBe(2);
  });

  it("replaces the stored types, dropping a trade the company no longer offers", async () => {
    await database.visitTypes.put({ type: "septic_tank_emptying", minutes: 120 });
    await database.visitTypes.put({ type: "chimney_sweeping", minutes: 60 });
    await saveVisitTypes(database, SERVER_TYPES);
    expect(await storedTypes()).toEqual(SERVER_TYPES);
  });

  it("empties the stored types when the company offers none", async () => {
    await database.visitTypes.put({ type: "chimney_sweeping", minutes: 60 });
    await saveVisitTypes(database, []);
    expect(await database.visitTypes.count()).toBe(0);
  });
});

describe("refreshVisitTypes", () => {
  it("stores the visit types fetched from the server", async () => {
    const fetchVisitTypes = vi.fn<FetchVisitTypes>(async () => ok({ visitTypes: SERVER_TYPES }));
    const result = await refreshVisitTypes(database, fetchVisitTypes);
    expect(fetchVisitTypes).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ isOk: true, value: { visitTypes: SERVER_TYPES } });
    expect(await storedTypes()).toEqual(SERVER_TYPES);
  });

  it("keeps the stored types when the server cannot be reached", async () => {
    await database.visitTypes.put({ type: "chimney_sweeping", minutes: 45 });
    const failure = { code: "network", traceId: null };
    const result = await refreshVisitTypes(
      database,
      vi.fn<FetchVisitTypes>(async () => err(failure)),
    );
    expect(result).toEqual({ isOk: false, error: failure });
    expect(await database.visitTypes.toArray()).toEqual([
      { type: "chimney_sweeping", minutes: 45 },
    ]);
  });
});
