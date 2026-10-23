import type { SchedulingMutation } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemorySchedulingState } from "../infrastructure/in-memory-scheduling-dependencies";
import { applySchedulingMutation } from "./apply-scheduling-mutation";
import {
  actorOf,
  INTERVENTION_ID,
  interventionFields,
  ORGANIZATION_B,
  OTHER_TECHNICIAN_ID,
  schedulingDependenciesOf,
  seededSchedulingState,
} from "./scheduling.fixture";

let state: InMemorySchedulingState;
let dependencies: ReturnType<typeof schedulingDependenciesOf>;

const creation: SchedulingMutation = {
  type: "create_intervention",
  interventionId: INTERVENTION_ID,
  intervention: interventionFields(),
};

const writesOnIntervention: readonly SchedulingMutation[] = [
  {
    type: "update_intervention",
    interventionId: INTERVENTION_ID,
    changes: { durationMinutes: 90 },
  },
  {
    type: "complete_intervention",
    interventionId: INTERVENTION_ID,
    completion: { completedOn: "2026-10-28" },
  },
  { type: "cancel_intervention", interventionId: INTERVENTION_ID },
];

const apply = applySchedulingMutation;
const stored = () => state.interventions.find(({ id }) => id === INTERVENTION_ID);

beforeEach(() => {
  state = seededSchedulingState();
  dependencies = schedulingDependenciesOf(state);
});

describe("applySchedulingMutation", () => {
  it("creates the intervention described by the mutation", async () => {
    expect(await apply(dependencies)(actorOf("secretary"), creation)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(stored()?.status).toBe("planned");
  });

  it("treats a replayed creation as applied without a second intervention", async () => {
    await apply(dependencies)(actorOf("secretary"), creation);
    expect(await apply(dependencies)(actorOf("secretary"), creation)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.interventions).toHaveLength(1);
  });

  it("refuses to create an intervention whose id is used by another organization", async () => {
    await apply(dependencies)(actorOf("secretary"), creation);
    expect(
      await apply(dependencies)(actorOf("owner", { organizationId: ORGANIZATION_B }), creation),
    ).toEqual({ isOk: false, error: "already_exists" });
    expect(state.interventions).toHaveLength(1);
  });

  it.each(
    writesOnIntervention.map((mutation): [string, SchedulingMutation] => [mutation.type, mutation]),
  )("never lets another organization apply %s to an intervention", async (_type, mutation) => {
    await apply(dependencies)(actorOf("secretary"), creation);
    const before = stored();
    expect(
      await apply(dependencies)(actorOf("owner", { organizationId: ORGANIZATION_B }), mutation),
    ).toEqual({ isOk: false, error: "intervention_not_found" });
    expect(stored()).toEqual(before);
  });

  it("turns a technician writing on another technician's intervention into a rejection", async () => {
    await apply(dependencies)(actorOf("secretary"), creation);
    const otherTechnician = actorOf("technician", { userId: OTHER_TECHNICIAN_ID });
    expect(
      await Promise.all(
        writesOnIntervention.map((mutation) => apply(dependencies)(otherTechnician, mutation)),
      ),
    ).toEqual(writesOnIntervention.map(() => ({ isOk: false, error: "forbidden" })));
    expect(stored()?.status).toBe("planned");
  });

  it("refuses every write during an impersonation", async () => {
    const impersonatedOwner = actorOf("owner", { isImpersonating: true });
    expect(await apply(dependencies)(impersonatedOwner, creation)).toEqual({
      isOk: false,
      error: "forbidden",
    });
    await apply(dependencies)(actorOf("secretary"), creation);
    expect(
      await Promise.all(
        writesOnIntervention.map((mutation) => apply(dependencies)(impersonatedOwner, mutation)),
      ),
    ).toEqual(writesOnIntervention.map(() => ({ isOk: false, error: "forbidden" })));
    expect(stored()?.status).toBe("planned");
  });
});
