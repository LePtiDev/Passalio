import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import type { VisitDurations } from "@passalio/trades";
import { beforeEach, describe, expect, it } from "vitest";
import type { VisitTypeSettings } from "../domain/visit-type-ports";
import { createInMemoryVisitTypeDependencies } from "../infrastructure/in-memory-visit-type-settings";
import { actorOf, ORGANIZATION_A, ORGANIZATION_B } from "./scheduling.fixture";
import { updateVisitDurations } from "./update-visit-durations";

let organizations: Map<string, VisitTypeSettings>;
const update = () => updateVisitDurations(createInMemoryVisitTypeDependencies(organizations));
const durationsOf = (organizationId: string) => organizations.get(organizationId)?.durations;

const INITIAL_DURATIONS_B: VisitDurations = { chimney_sweeping: 30 };

beforeEach(() => {
  organizations = new Map<string, VisitTypeSettings>([
    [
      ORGANIZATION_A,
      {
        trades: ["chimney_sweeping", "stove_maintenance", "boiler_maintenance"],
        durations: { chimney_sweeping: 45 },
      },
    ],
    [ORGANIZATION_B, { trades: ["chimney_sweeping"], durations: INITIAL_DURATIONS_B }],
  ]);
});

describe("updateVisitDurations", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "lets the %s change the duration of a visit type",
    async (role) => {
      expect(await update()(actorOf(role), { stove_maintenance: 120 })).toEqual({
        isOk: true,
        value: [
          { type: "chimney_sweeping", minutes: 45 },
          { type: "stove_maintenance", minutes: 120 },
          { type: "boiler_maintenance", minutes: 60 },
        ],
      });
      expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 45, stove_maintenance: 120 });
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])(
    "forbids the %s to change a duration",
    async (role) => {
      await expect(update()(actorOf(role), { stove_maintenance: 120 })).rejects.toThrow(
        ForbiddenError,
      );
      expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 45 });
    },
  );

  it.each<OrganizationRole>(["owner", "admin"])(
    "refuses the change to an impersonated %s",
    async (role) => {
      await expect(
        update()(actorOf(role, { isImpersonating: true }), { stove_maintenance: 120 }),
      ).rejects.toThrow(ForbiddenError);
      expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 45 });
    },
  );

  it("merges the changes with the durations already chosen", async () => {
    await update()(actorOf("owner"), { boiler_maintenance: 75 });
    await update()(actorOf("owner"), { stove_maintenance: 105 });
    expect(durationsOf(ORGANIZATION_A)).toEqual({
      chimney_sweeping: 45,
      boiler_maintenance: 75,
      stove_maintenance: 105,
    });
  });

  it("replaces a duration already chosen", async () => {
    await update()(actorOf("owner"), { chimney_sweeping: 90 });
    expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 90 });
  });

  it("keeps every duration when the change is empty", async () => {
    expect((await update()(actorOf("owner"), {})).isOk).toBe(true);
    expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 45 });
  });

  it("refuses a type that is not a trade of the company", async () => {
    expect(await update()(actorOf("owner"), { septic_tank_emptying: 120 })).toEqual({
      isOk: false,
      error: "invalid_visit_type",
    });
    expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 45 });
  });

  it("saves nothing when one of the changed types is not a trade of the company", async () => {
    expect(
      await update()(actorOf("owner"), { stove_maintenance: 120, heat_pump_maintenance: 90 }),
    ).toEqual({ isOk: false, error: "invalid_visit_type" });
    expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 45 });
  });

  it("changes only the durations of the actor's company", async () => {
    await update()(actorOf("owner"), { chimney_sweeping: 120 });
    expect(durationsOf(ORGANIZATION_A)).toEqual({ chimney_sweeping: 120 });
    expect(durationsOf(ORGANIZATION_B)).toEqual(INITIAL_DURATIONS_B);
  });

  it("judges the types against the trades of the actor's company", async () => {
    expect(
      await update()(actorOf("owner", { organizationId: ORGANIZATION_B }), {
        stove_maintenance: 120,
      }),
    ).toEqual({ isOk: false, error: "invalid_visit_type" });
    expect(durationsOf(ORGANIZATION_B)).toEqual(INITIAL_DURATIONS_B);
  });

  it("reports an unknown company", async () => {
    expect(
      await update()(actorOf("owner", { organizationId: "organization-unknown" }), {
        chimney_sweeping: 60,
      }),
    ).toEqual({ isOk: false, error: "organization_not_found" });
  });
});
