import type { OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { VisitTypeSettings } from "../domain/visit-type-ports";
import { createInMemoryVisitTypeDependencies } from "../infrastructure/in-memory-visit-type-settings";
import { getVisitTypes } from "./get-visit-types";
import { actorOf, ORGANIZATION_A, ORGANIZATION_B } from "./scheduling.fixture";

let organizations: Map<string, VisitTypeSettings>;
const read = () => getVisitTypes(createInMemoryVisitTypeDependencies(organizations));

beforeEach(() => {
  organizations = new Map<string, VisitTypeSettings>([
    [
      ORGANIZATION_A,
      {
        trades: ["chimney_sweeping", "stove_maintenance", "septic_tank_emptying"],
        durations: { chimney_sweeping: 45 },
      },
    ],
    [ORGANIZATION_B, { trades: ["boiler_maintenance"], durations: { boiler_maintenance: 30 } }],
  ]);
});

describe("getVisitTypes", () => {
  it("lists one visit type per trade of the company, with its own or the default duration", async () => {
    expect(await read()(actorOf("owner"))).toEqual({
      isOk: true,
      value: [
        { type: "chimney_sweeping", minutes: 45 },
        { type: "stove_maintenance", minutes: 90 },
        { type: "septic_tank_emptying", minutes: 120 },
      ],
    });
  });

  it.each<OrganizationRole>(["owner", "admin", "secretary", "technician"])(
    "lets the %s read the visit types",
    async (role) => {
      expect((await read()(actorOf(role))).isOk).toBe(true);
    },
  );

  it("lets an impersonated member read the visit types", async () => {
    expect((await read()(actorOf("technician", { isImpersonating: true }))).isOk).toBe(true);
  });

  it("reads only the visit types of the actor's company", async () => {
    expect(await read()(actorOf("technician", { organizationId: ORGANIZATION_B }))).toEqual({
      isOk: true,
      value: [{ type: "boiler_maintenance", minutes: 30 }],
    });
  });

  it("ignores a duration kept for a trade the company no longer offers", async () => {
    organizations.set(ORGANIZATION_A, {
      trades: ["stove_maintenance"],
      durations: { chimney_sweeping: 45, stove_maintenance: 105 },
    });
    expect(await read()(actorOf("owner"))).toEqual({
      isOk: true,
      value: [{ type: "stove_maintenance", minutes: 105 }],
    });
  });

  it("returns no visit type to a company without trade", async () => {
    organizations.set(ORGANIZATION_A, { trades: [], durations: {} });
    expect(await read()(actorOf("owner"))).toEqual({ isOk: true, value: [] });
  });

  it("reports an unknown company", async () => {
    expect(await read()(actorOf("owner", { organizationId: "organization-unknown" }))).toEqual({
      isOk: false,
      error: "organization_not_found",
    });
  });
});
