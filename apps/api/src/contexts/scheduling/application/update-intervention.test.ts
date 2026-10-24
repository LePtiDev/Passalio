import {
  ForbiddenError,
  type Actor,
  type InterventionChanges,
  type OrganizationRole,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemorySchedulingState } from "../infrastructure/in-memory-scheduling-dependencies";
import { cancelIntervention, completeIntervention } from "./close-intervention";
import { createIntervention } from "./create-intervention";
import {
  actorOf,
  EQUIPMENT_ID,
  INTERVENTION_ID,
  interventionFields,
  ORGANIZATION_B,
  OTHER_SITE_EQUIPMENT_ID,
  OTHER_TECHNICIAN_ID,
  OUTSIDER_ID,
  schedulingDependenciesOf,
  SECOND_EQUIPMENT_ID,
  seededSchedulingState,
  TECHNICIAN_ID,
} from "./scheduling.fixture";
import { updateIntervention } from "./update-intervention";

let state: InMemorySchedulingState;
let dependencies: ReturnType<typeof schedulingDependenciesOf>;

const update = (actor: Actor, changes: InterventionChanges) =>
  updateIntervention(dependencies)(actor, { interventionId: INTERVENTION_ID, changes });

const stored = () => state.interventions.find(({ id }) => id === INTERVENTION_ID);

beforeEach(async () => {
  state = seededSchedulingState();
  dependencies = schedulingDependenciesOf(state);
  await createIntervention(dependencies)(actorOf("secretary"), {
    id: INTERVENTION_ID,
    intervention: interventionFields(),
  });
});

describe("updateIntervention", () => {
  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "lets the %s reschedule any intervention and stamps the update time",
    async (role) => {
      const before = stored()?.updatedAt;
      expect(await update(actorOf(role), { scheduledDate: "2026-11-02" })).toEqual({
        isOk: true,
        value: undefined,
      });
      expect(stored()?.scheduledDate).toBe("2026-11-02");
      expect(stored()?.updatedAt.getTime()).toBeGreaterThan(before?.getTime() ?? Infinity);
    },
  );

  it("lets a technician change his own intervention", async () => {
    expect((await update(actorOf("technician"), { durationMinutes: 90 })).isOk).toBe(true);
    expect(stored()?.durationMinutes).toBe(90);
  });

  it("forbids a technician to change the intervention of another technician", async () => {
    await expect(
      update(actorOf("technician", { userId: OTHER_TECHNICIAN_ID }), { durationMinutes: 90 }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.durationMinutes).toBe(60);
  });

  it("forbids a technician to hand his intervention to someone else", async () => {
    await expect(
      update(actorOf("technician"), { technicianUserId: OTHER_TECHNICIAN_ID }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.technicianUserId).toBe(TECHNICIAN_ID);
  });

  it("lets the secretary reassign the intervention to another member", async () => {
    expect(
      (await update(actorOf("secretary"), { technicianUserId: OTHER_TECHNICIAN_ID })).isOk,
    ).toBe(true);
    expect(stored()?.technicianUserId).toBe(OTHER_TECHNICIAN_ID);
  });

  it("refuses to reassign the intervention to someone outside the organization", async () => {
    expect(await update(actorOf("secretary"), { technicianUserId: OUTSIDER_ID })).toEqual({
      isOk: false,
      error: "technician_not_member",
    });
    expect(stored()?.technicianUserId).toBe(TECHNICIAN_ID);
  });

  it("refuses an equipment that is not at the intervention site", async () => {
    expect(await update(actorOf("secretary"), { equipmentIds: [OTHER_SITE_EQUIPMENT_ID] })).toEqual(
      { isOk: false, error: "equipment_not_found" },
    );
    expect(stored()?.equipmentIds).toEqual([EQUIPMENT_ID]);
  });

  it("keeps a single copy of an equipment listed twice", async () => {
    await update(actorOf("secretary"), {
      equipmentIds: [SECOND_EQUIPMENT_ID, EQUIPMENT_ID, SECOND_EQUIPMENT_ID],
    });
    expect(stored()?.equipmentIds).toEqual([SECOND_EQUIPMENT_ID, EQUIPMENT_ID]);
  });

  it("refuses to change a completed intervention", async () => {
    await completeIntervention(dependencies)(actorOf("technician"), {
      interventionId: INTERVENTION_ID,
      completion: { completedOn: "2026-10-28" },
    });
    expect(await update(actorOf("secretary"), { durationMinutes: 90 })).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
  });

  it("refuses to change a cancelled intervention", async () => {
    await cancelIntervention(dependencies)(actorOf("secretary"), {
      interventionId: INTERVENTION_ID,
    });
    expect(await update(actorOf("secretary"), { durationMinutes: 90 })).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
  });

  it("does not find the intervention from another organization", async () => {
    expect(
      await update(actorOf("owner", { organizationId: ORGANIZATION_B }), { durationMinutes: 90 }),
    ).toEqual({ isOk: false, error: "intervention_not_found" });
    expect(stored()?.durationMinutes).toBe(60);
  });

  it.each<OrganizationRole>(["owner", "secretary", "technician"])(
    "refuses the change to an impersonated %s",
    async (role) => {
      await expect(
        update(actorOf(role, { isImpersonating: true }), { durationMinutes: 90 }),
      ).rejects.toThrow(ForbiddenError);
      expect(stored()?.durationMinutes).toBe(60);
    },
  );
});

describe("updateIntervention with visit types", () => {
  it("changes the visit types of the intervention", async () => {
    expect(
      await update(actorOf("secretary"), { visitTypes: ["stove_maintenance", "chimney_sweeping"] }),
    ).toEqual({ isOk: true, value: undefined });
    expect(stored()?.visitTypes).toEqual(["stove_maintenance", "chimney_sweeping"]);
  });

  it("keeps the visit types when the change does not mention them", async () => {
    await update(actorOf("secretary"), { visitTypes: ["boiler_maintenance"] });
    await update(actorOf("secretary"), { durationMinutes: 90 });
    expect(stored()?.visitTypes).toEqual(["boiler_maintenance"]);
    expect(stored()?.durationMinutes).toBe(90);
  });

  it("removes every visit type with an empty list", async () => {
    await update(actorOf("secretary"), { visitTypes: ["boiler_maintenance"] });
    await update(actorOf("secretary"), { visitTypes: [] });
    expect(stored()?.visitTypes).toEqual([]);
  });

  it("keeps a single copy of a visit type listed twice", async () => {
    await update(actorOf("secretary"), {
      visitTypes: ["boiler_maintenance", "chimney_sweeping", "boiler_maintenance"],
    });
    expect(stored()?.visitTypes).toEqual(["boiler_maintenance", "chimney_sweeping"]);
  });

  it("refuses an unknown visit type and changes nothing", async () => {
    expect(
      await update(actorOf("secretary"), {
        durationMinutes: 90,
        visitTypes: ["chimney_sweeping", "plumbing"],
      }),
    ).toEqual({ isOk: false, error: "invalid_visit_type" });
    expect(stored()?.visitTypes).toEqual([]);
    expect(stored()?.durationMinutes).toBe(60);
  });

  it("lets a technician change the visit types of his own intervention", async () => {
    expect((await update(actorOf("technician"), { visitTypes: ["chimney_sweeping"] })).isOk).toBe(
      true,
    );
    expect(stored()?.visitTypes).toEqual(["chimney_sweeping"]);
  });

  it("forbids a technician to change the visit types of another technician's intervention", async () => {
    await expect(
      update(actorOf("technician", { userId: OTHER_TECHNICIAN_ID }), {
        visitTypes: ["chimney_sweeping"],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.visitTypes).toEqual([]);
  });

  it("refuses to change the visit types during an impersonation", async () => {
    await expect(
      update(actorOf("owner", { isImpersonating: true }), { visitTypes: ["chimney_sweeping"] }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.visitTypes).toEqual([]);
  });

  it("refuses to change the visit types of a completed intervention", async () => {
    await completeIntervention(dependencies)(actorOf("technician"), {
      interventionId: INTERVENTION_ID,
      completion: { completedOn: "2026-10-28" },
    });
    expect(await update(actorOf("secretary"), { visitTypes: ["chimney_sweeping"] })).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
    expect(stored()?.visitTypes).toEqual([]);
  });

  it("does not change the visit types of an intervention of another organization", async () => {
    expect(
      await update(actorOf("owner", { organizationId: ORGANIZATION_B }), {
        visitTypes: ["chimney_sweeping"],
      }),
    ).toEqual({ isOk: false, error: "intervention_not_found" });
    expect(stored()?.visitTypes).toEqual([]);
  });
});
