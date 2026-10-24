import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemorySchedulingState } from "../infrastructure/in-memory-scheduling-dependencies";
import { createIntervention } from "./create-intervention";
import {
  actorOf,
  EQUIPMENT_ID,
  FOREIGN_SITE_ID,
  INTERVENTION_ID,
  interventionFields,
  ORGANIZATION_A,
  OTHER_CUSTOMER_ID,
  OTHER_SITE_EQUIPMENT_ID,
  OTHER_TECHNICIAN_ID,
  OUTSIDER_ID,
  schedulingDependenciesOf,
  SECOND_EQUIPMENT_ID,
  seededSchedulingState,
  TECHNICIAN_ID,
} from "./scheduling.fixture";

let state: InMemorySchedulingState;
const create = () => createIntervention(schedulingDependenciesOf(state));

beforeEach(() => {
  state = seededSchedulingState();
});

describe("createIntervention", () => {
  it("lets the secretary plan an intervention for a technician", async () => {
    const created = await create()(actorOf("secretary"), {
      id: INTERVENTION_ID,
      intervention: interventionFields(),
    });
    expect(created).toMatchObject({
      isOk: true,
      value: {
        id: INTERVENTION_ID,
        organizationId: ORGANIZATION_A,
        technicianUserId: TECHNICIAN_ID,
        createdByUserId: "user-secretary",
        status: "planned",
        equipmentIds: [EQUIPMENT_ID],
      },
    });
    expect(state.interventions).toHaveLength(1);
  });

  it.each<OrganizationRole>(["owner", "admin"])(
    "lets the %s plan an intervention",
    async (role) => {
      expect((await create()(actorOf(role), { intervention: interventionFields() })).isOk).toBe(
        true,
      );
      expect(state.interventions).toHaveLength(1);
    },
  );

  it("gives a new intervention an id when none is provided", async () => {
    const created = await create()(actorOf("secretary"), { intervention: interventionFields() });
    expect(created.isOk && created.value.id.length > 0).toBe(true);
  });

  it("lets a technician plan his own intervention", async () => {
    expect(
      (await create()(actorOf("technician"), { intervention: interventionFields() })).isOk,
    ).toBe(true);
  });

  it("forbids a technician to plan an intervention for another technician", async () => {
    await expect(
      create()(actorOf("technician"), {
        intervention: interventionFields({ technicianUserId: OTHER_TECHNICIAN_ID }),
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.interventions).toHaveLength(0);
  });

  it.each<OrganizationRole>(["owner", "secretary", "technician"])(
    "refuses the creation to an impersonated %s",
    async (role) => {
      await expect(
        create()(actorOf(role, { isImpersonating: true }), { intervention: interventionFields() }),
      ).rejects.toThrow(ForbiddenError);
      expect(state.interventions).toHaveLength(0);
    },
  );

  it("refuses a site of another organization", async () => {
    expect(
      await create()(actorOf("secretary"), {
        intervention: interventionFields({ siteId: FOREIGN_SITE_ID }),
      }),
    ).toEqual({ isOk: false, error: "site_not_found" });
  });

  it("refuses an unknown site", async () => {
    expect(
      await create()(actorOf("secretary"), {
        intervention: interventionFields({ siteId: "0190f3a0-0000-7000-8000-0000000000ff" }),
      }),
    ).toEqual({ isOk: false, error: "site_not_found" });
  });

  it("refuses a customer that does not own the site", async () => {
    expect(
      await create()(actorOf("secretary"), {
        intervention: interventionFields({ customerId: OTHER_CUSTOMER_ID }),
      }),
    ).toEqual({ isOk: false, error: "customer_not_found" });
  });

  it("refuses an equipment that is not active at the site", async () => {
    expect(
      await create()(actorOf("secretary"), {
        intervention: interventionFields({ equipmentIds: [EQUIPMENT_ID, OTHER_SITE_EQUIPMENT_ID] }),
      }),
    ).toEqual({ isOk: false, error: "equipment_not_found" });
    expect(state.interventions).toHaveLength(0);
  });

  it("refuses a technician who is not a member of the organization", async () => {
    expect(
      await create()(actorOf("secretary"), {
        intervention: interventionFields({ technicianUserId: OUTSIDER_ID }),
      }),
    ).toEqual({ isOk: false, error: "technician_not_member" });
  });

  it("refuses an id already used", async () => {
    await create()(actorOf("secretary"), {
      id: INTERVENTION_ID,
      intervention: interventionFields(),
    });
    expect(
      await create()(actorOf("secretary"), {
        id: INTERVENTION_ID,
        intervention: interventionFields(),
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(state.interventions).toHaveLength(1);
  });

  it("keeps a single copy of an equipment listed twice", async () => {
    const created = await create()(actorOf("secretary"), {
      intervention: interventionFields({
        equipmentIds: [EQUIPMENT_ID, SECOND_EQUIPMENT_ID, EQUIPMENT_ID],
      }),
    });
    expect(created).toMatchObject({
      isOk: true,
      value: { equipmentIds: [EQUIPMENT_ID, SECOND_EQUIPMENT_ID] },
    });
  });
});

describe("createIntervention with visit types", () => {
  it("keeps the visit types of the new intervention", async () => {
    const created = await create()(actorOf("secretary"), {
      id: INTERVENTION_ID,
      intervention: interventionFields({ visitTypes: ["chimney_sweeping", "stove_maintenance"] }),
    });
    expect(created).toMatchObject({
      isOk: true,
      value: { visitTypes: ["chimney_sweeping", "stove_maintenance"] },
    });
    expect(state.interventions[0]?.visitTypes).toEqual(["chimney_sweeping", "stove_maintenance"]);
  });

  it("gives no visit type to an intervention created without visit types", async () => {
    const created = await create()(actorOf("secretary"), { intervention: interventionFields() });
    expect(created).toMatchObject({ isOk: true, value: { visitTypes: [] } });
    expect(state.interventions[0]?.visitTypes).toEqual([]);
  });

  it("keeps a single copy of a visit type listed twice", async () => {
    const created = await create()(actorOf("secretary"), {
      intervention: interventionFields({
        visitTypes: ["chimney_sweeping", "boiler_maintenance", "chimney_sweeping"],
      }),
    });
    expect(created).toMatchObject({
      isOk: true,
      value: { visitTypes: ["chimney_sweeping", "boiler_maintenance"] },
    });
  });

  it("refuses an unknown visit type and creates nothing", async () => {
    expect(
      await create()(actorOf("secretary"), {
        intervention: interventionFields({ visitTypes: ["chimney_sweeping", "plumbing"] }),
      }),
    ).toEqual({ isOk: false, error: "invalid_visit_type" });
    expect(state.interventions).toHaveLength(0);
  });

  it("keeps the planned duration whatever the visit types", async () => {
    const created = await create()(actorOf("secretary"), {
      intervention: interventionFields({
        durationMinutes: 40,
        visitTypes: ["chimney_sweeping", "stove_maintenance"],
      }),
    });
    expect(created).toMatchObject({ isOk: true, value: { durationMinutes: 40 } });
  });
});
