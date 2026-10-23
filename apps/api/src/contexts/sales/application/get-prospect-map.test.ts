import { PLATFORM_ROLES, prospectMapResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { getProspectMap } from "./get-prospect-map";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  getProspectMap(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({
      id: "company-1",
      name: "Gaz Hop",
      city: "Alfortville",
      department: "94",
      phone: "0102030405",
      stage: "qualified",
      latitude: 48.8,
      longitude: 2.42,
    }),
    inMemoryCompany({
      id: "company-2",
      name: "Ramonage Paris",
      department: "75",
      stage: "to_qualify",
      latitude: 48.85,
      longitude: 2.35,
    }),
    inMemoryCompany({ id: "company-3", name: "Sans adresse", department: "94" }),
  );
});

describe("getProspectMap", () => {
  it.each(PLATFORM_ROLES)("gives the map to a %s", async (role) => {
    const map = await run()(platformActorWith(role), {});
    expect(prospectMapResponse.parse(map)).toEqual(map);
  });

  it("places every company that has coordinates", async () => {
    expect(await run()(sales, {})).toEqual({
      pins: [
        {
          id: "company-1",
          name: "Gaz Hop",
          city: "Alfortville",
          phone: "0102030405",
          stage: "qualified",
          latitude: 48.8,
          longitude: 2.42,
        },
        {
          id: "company-2",
          name: "Ramonage Paris",
          city: null,
          phone: null,
          stage: "to_qualify",
          latitude: 48.85,
          longitude: 2.35,
        },
      ],
    });
  });

  it("narrows the map to a department and a stage", async () => {
    expect((await run()(sales, { department: "75" })).pins.map(({ id }) => id)).toEqual([
      "company-2",
    ]);
    expect((await run()(sales, { stage: "qualified" })).pins.map(({ id }) => id)).toEqual([
      "company-1",
    ]);
    expect((await run()(sales, { department: "75", stage: "qualified" })).pins).toEqual([]);
  });
});
