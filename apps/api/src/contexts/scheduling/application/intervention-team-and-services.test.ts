import {
  ForbiddenError,
  type Actor,
  type InterventionChanges,
  type InterventionFields,
  type ServiceLine,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemorySchedulingState } from "../infrastructure/in-memory-scheduling-dependencies";
import { cancelIntervention, completeIntervention } from "./close-intervention";
import { createIntervention } from "./create-intervention";
import {
  actorOf,
  INTERVENTION_ID,
  interventionFields,
  ORGANIZATION_A,
  ORGANIZATION_B,
  OTHER_TECHNICIAN_ID,
  OUTSIDER_ID,
  schedulingDependenciesOf,
  seededSchedulingState,
  TECHNICIAN_ID,
} from "./scheduling.fixture";
import { updateIntervention } from "./update-intervention";

const THIRD_TECHNICIAN_ID = "user-third-technician";
const SWEEPING_ID = "0190f3a0-0000-7000-8000-000000000501";
const STOVE_ID = "0190f3a0-0000-7000-8000-000000000502";
const FOREIGN_SERVICE_ID = "0190f3a0-0000-7000-8000-000000000503";
const UNKNOWN_SERVICE_ID = "0190f3a0-0000-7000-8000-000000000599";

const sweeping: ServiceLine = {
  serviceId: SWEEPING_ID,
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
};

const stove: ServiceLine = {
  serviceId: STOVE_ID,
  name: "Entretien poêle",
  durationMinutes: 90,
  priceCents: null,
};

let state: InMemorySchedulingState;
let dependencies: ReturnType<typeof schedulingDependenciesOf>;

const create = (actor: Actor, overrides: Partial<InterventionFields>) =>
  createIntervention(dependencies)(actor, {
    id: INTERVENTION_ID,
    intervention: interventionFields(overrides),
  });

const update = (actor: Actor, changes: InterventionChanges) =>
  updateIntervention(dependencies)(actor, { interventionId: INTERVENTION_ID, changes });

const stored = () => state.interventions.find(({ id }) => id === INTERVENTION_ID);

const secondTechnician = () => actorOf("technician", { userId: OTHER_TECHNICIAN_ID });

beforeEach(() => {
  state = seededSchedulingState();
  state.members.add(`${ORGANIZATION_A}:${THIRD_TECHNICIAN_ID}`);
  state.services.set(SWEEPING_ID, ORGANIZATION_A);
  state.services.set(STOVE_ID, ORGANIZATION_A);
  state.services.set(FOREIGN_SERVICE_ID, ORGANIZATION_B);
  dependencies = schedulingDependenciesOf(state);
});

describe("createIntervention with several technicians", () => {
  it("stores the lead first followed by the other technicians", async () => {
    expect(
      (
        await create(actorOf("secretary"), {
          technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
        })
      ).isOk,
    ).toBe(true);
    expect(stored()?.technicianUserId).toBe(TECHNICIAN_ID);
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("adds the lead to the list when the list leaves him out", async () => {
    await create(actorOf("secretary"), { technicianUserIds: [OTHER_TECHNICIAN_ID] });
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("collapses duplicated technicians", async () => {
    await create(actorOf("secretary"), {
      technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID, OTHER_TECHNICIAN_ID, TECHNICIAN_ID],
    });
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("stores the lead alone when no list is given", async () => {
    await create(actorOf("secretary"), {});
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID]);
  });

  it("refuses a second technician who is not a member of the company", async () => {
    expect(
      await create(actorOf("secretary"), { technicianUserIds: [TECHNICIAN_ID, OUTSIDER_ID] }),
    ).toEqual({ isOk: false, error: "technician_not_member" });
    expect(state.interventions).toHaveLength(0);
  });

  it("lets a technician book a visit he shares with another technician", async () => {
    expect(
      (
        await create(actorOf("technician"), {
          technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
        })
      ).isOk,
    ).toBe(true);
  });

  it("lets a technician book a visit led by another technician when he is in the list", async () => {
    expect(
      (
        await create(secondTechnician(), {
          technicianUserId: TECHNICIAN_ID,
          technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
        })
      ).isOk,
    ).toBe(true);
  });

  it("forbids a technician to book a visit for other technicians only", async () => {
    await expect(
      create(actorOf("technician", { userId: THIRD_TECHNICIAN_ID }), {
        technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.interventions).toHaveLength(0);
  });

  it("refuses the booking while impersonating", async () => {
    await expect(
      create(actorOf("owner", { isImpersonating: true }), {
        technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.interventions).toHaveLength(0);
  });
});

describe("createIntervention with service lines", () => {
  it("stores the service lines as they were sent", async () => {
    expect((await create(actorOf("secretary"), { serviceLines: [sweeping, stove] })).isOk).toBe(
      true,
    );
    expect(stored()?.serviceLines).toEqual([sweeping, stove]);
  });

  it("stores no service line when none is sent", async () => {
    await create(actorOf("secretary"), {});
    expect(stored()?.serviceLines).toEqual([]);
  });

  it("collapses duplicated service lines and keeps the first one", async () => {
    await create(actorOf("secretary"), {
      serviceLines: [sweeping, stove, { ...sweeping, priceCents: 1 }],
    });
    expect(stored()?.serviceLines).toEqual([sweeping, stove]);
  });

  it("refuses a service that does not exist", async () => {
    expect(
      await create(actorOf("secretary"), {
        serviceLines: [sweeping, { ...stove, serviceId: UNKNOWN_SERVICE_ID }],
      }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(state.interventions).toHaveLength(0);
  });

  it("refuses a service of another company", async () => {
    expect(
      await create(actorOf("secretary"), {
        serviceLines: [{ ...sweeping, serviceId: FOREIGN_SERVICE_ID }],
      }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(state.interventions).toHaveLength(0);
  });
});

describe("updateIntervention of a visit shared by two technicians", () => {
  beforeEach(async () => {
    await create(actorOf("secretary"), {
      technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
      serviceLines: [sweeping],
    });
  });

  it("lets the second technician change the visit", async () => {
    expect(await update(secondTechnician(), { durationMinutes: 90 })).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(stored()?.durationMinutes).toBe(90);
  });

  it("forbids a technician outside the list to change the visit", async () => {
    await expect(
      update(actorOf("technician", { userId: THIRD_TECHNICIAN_ID }), { durationMinutes: 90 }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.durationMinutes).toBe(60);
  });

  it("forbids the second technician to remove himself from the list", async () => {
    await expect(
      update(secondTechnician(), { technicianUserIds: [TECHNICIAN_ID] }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("forbids the lead to remove himself from the list", async () => {
    await expect(
      update(actorOf("technician"), { technicianUserIds: [OTHER_TECHNICIAN_ID] }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("lets a technician of the list add a third technician", async () => {
    expect(
      (
        await update(secondTechnician(), {
          technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID, THIRD_TECHNICIAN_ID],
        })
      ).isOk,
    ).toBe(true);
    expect(stored()?.technicianUserIds).toEqual([
      TECHNICIAN_ID,
      OTHER_TECHNICIAN_ID,
      THIRD_TECHNICIAN_ID,
    ]);
  });

  it("lets the secretary replace the whole list and makes its first technician the lead", async () => {
    expect(
      (
        await update(actorOf("secretary"), {
          technicianUserIds: [THIRD_TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
        })
      ).isOk,
    ).toBe(true);
    expect(stored()?.technicianUserId).toBe(THIRD_TECHNICIAN_ID);
    expect(stored()?.technicianUserIds).toEqual([THIRD_TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("keeps the second technician when the secretary changes only the lead", async () => {
    await update(actorOf("secretary"), { technicianUserId: THIRD_TECHNICIAN_ID });
    expect(stored()?.technicianUserId).toBe(THIRD_TECHNICIAN_ID);
    expect(stored()?.technicianUserIds).toEqual([THIRD_TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("collapses duplicated technicians on update", async () => {
    await update(actorOf("secretary"), {
      technicianUserIds: [OTHER_TECHNICIAN_ID, OTHER_TECHNICIAN_ID, TECHNICIAN_ID],
    });
    expect(stored()?.technicianUserIds).toEqual([OTHER_TECHNICIAN_ID, TECHNICIAN_ID]);
  });

  it("refuses a technician who is not a member of the company", async () => {
    expect(
      await update(actorOf("secretary"), { technicianUserIds: [TECHNICIAN_ID, OUTSIDER_ID] }),
    ).toEqual({ isOk: false, error: "technician_not_member" });
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("keeps the technicians when other fields change", async () => {
    await update(actorOf("secretary"), { notes: "Portail bleu" });
    expect(stored()?.technicianUserIds).toEqual([TECHNICIAN_ID, OTHER_TECHNICIAN_ID]);
  });

  it("replaces the service lines", async () => {
    expect((await update(secondTechnician(), { serviceLines: [stove, sweeping] })).isOk).toBe(true);
    expect(stored()?.serviceLines).toEqual([stove, sweeping]);
  });

  it("removes every service line", async () => {
    await update(actorOf("secretary"), { serviceLines: [] });
    expect(stored()?.serviceLines).toEqual([]);
  });

  it("keeps the service lines when other fields change", async () => {
    await update(actorOf("secretary"), { durationMinutes: 120 });
    expect(stored()?.serviceLines).toEqual([sweeping]);
  });

  it("collapses duplicated service lines on update", async () => {
    await update(actorOf("secretary"), { serviceLines: [stove, stove, sweeping] });
    expect(stored()?.serviceLines).toEqual([stove, sweeping]);
  });

  it("refuses an unknown service on update and keeps the lines", async () => {
    expect(
      await update(actorOf("secretary"), {
        serviceLines: [{ ...stove, serviceId: UNKNOWN_SERVICE_ID }],
      }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(stored()?.serviceLines).toEqual([sweeping]);
  });

  it("refuses a service of another company on update", async () => {
    expect(
      await update(actorOf("secretary"), {
        serviceLines: [{ ...stove, serviceId: FOREIGN_SERVICE_ID }],
      }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(stored()?.serviceLines).toEqual([sweeping]);
  });
});

describe("closing a visit shared by two technicians", () => {
  beforeEach(async () => {
    await create(actorOf("secretary"), {
      technicianUserIds: [TECHNICIAN_ID, OTHER_TECHNICIAN_ID],
    });
  });

  it("lets the second technician complete the visit", async () => {
    expect(
      await completeIntervention(dependencies)(secondTechnician(), {
        interventionId: INTERVENTION_ID,
        completion: { completedOn: "2026-10-28", paymentMethod: "card", paidAmountCents: 8000 },
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(stored()?.status).toBe("completed");
  });

  it("lets the second technician cancel the visit", async () => {
    expect(
      await cancelIntervention(dependencies)(secondTechnician(), {
        interventionId: INTERVENTION_ID,
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(stored()?.status).toBe("cancelled");
  });

  it("forbids a technician outside the list to complete the visit", async () => {
    await expect(
      completeIntervention(dependencies)(actorOf("technician", { userId: THIRD_TECHNICIAN_ID }), {
        interventionId: INTERVENTION_ID,
        completion: { completedOn: "2026-10-28" },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.status).toBe("planned");
  });

  it("forbids a technician outside the list to cancel the visit", async () => {
    await expect(
      cancelIntervention(dependencies)(actorOf("technician", { userId: THIRD_TECHNICIAN_ID }), {
        interventionId: INTERVENTION_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.status).toBe("planned");
  });
});
