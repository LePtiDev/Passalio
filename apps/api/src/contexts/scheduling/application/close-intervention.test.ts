import {
  ForbiddenError,
  type InterventionCompletion,
  type OrganizationRole,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemorySchedulingState } from "../infrastructure/in-memory-scheduling-dependencies";
import { cancelIntervention, completeIntervention } from "./close-intervention";
import { createIntervention } from "./create-intervention";
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

const target = { interventionId: INTERVENTION_ID };
const paidByCard: InterventionCompletion = {
  completedOn: "2026-10-28",
  paymentMethod: "card",
  paidAmountCents: 8500,
};
const completion = { ...target, completion: paidByCard };
const stored = () => state.interventions.find(({ id }) => id === INTERVENTION_ID);

beforeEach(async () => {
  state = seededSchedulingState();
  dependencies = schedulingDependenciesOf(state);
  await createIntervention(dependencies)(actorOf("secretary"), {
    id: INTERVENTION_ID,
    intervention: interventionFields(),
  });
});

describe("completeIntervention", () => {
  it("records the completion day, payment method and paid amount", async () => {
    expect(await completeIntervention(dependencies)(actorOf("technician"), completion)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(stored()).toMatchObject({
      status: "completed",
      completedOn: "2026-10-28",
      paymentMethod: "card",
      paidAmountCents: 8500,
    });
  });

  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "lets the %s complete the intervention of a technician",
    async (role) => {
      expect((await completeIntervention(dependencies)(actorOf(role), completion)).isOk).toBe(true);
    },
  );

  it("forbids a technician to complete the intervention of another technician", async () => {
    await expect(
      completeIntervention(dependencies)(
        actorOf("technician", { userId: OTHER_TECHNICIAN_ID }),
        completion,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.status).toBe("planned");
  });

  it("refuses to complete a cancelled intervention", async () => {
    await cancelIntervention(dependencies)(actorOf("secretary"), target);
    expect(await completeIntervention(dependencies)(actorOf("technician"), completion)).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
    expect(stored()?.status).toBe("cancelled");
  });

  it("does not find the intervention from another organization", async () => {
    expect(
      await completeIntervention(dependencies)(
        actorOf("owner", { organizationId: ORGANIZATION_B }),
        completion,
      ),
    ).toEqual({ isOk: false, error: "intervention_not_found" });
  });

  it("refuses the completion to an impersonated technician", async () => {
    await expect(
      completeIntervention(dependencies)(
        actorOf("technician", { isImpersonating: true }),
        completion,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.status).toBe("planned");
  });
});

describe("cancelIntervention", () => {
  it("cancels a planned intervention", async () => {
    expect(await cancelIntervention(dependencies)(actorOf("secretary"), target)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(stored()?.status).toBe("cancelled");
  });

  it("lets a technician cancel his own intervention", async () => {
    expect((await cancelIntervention(dependencies)(actorOf("technician"), target)).isOk).toBe(true);
  });

  it("forbids a technician to cancel the intervention of another technician", async () => {
    await expect(
      cancelIntervention(dependencies)(
        actorOf("technician", { userId: OTHER_TECHNICIAN_ID }),
        target,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.status).toBe("planned");
  });

  it("refuses to cancel a completed intervention", async () => {
    await completeIntervention(dependencies)(actorOf("technician"), completion);
    expect(await cancelIntervention(dependencies)(actorOf("secretary"), target)).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
    expect(stored()?.status).toBe("completed");
  });

  it("accepts a second cancellation without touching the update time", async () => {
    await cancelIntervention(dependencies)(actorOf("secretary"), target);
    const cancelledAt = stored()?.updatedAt;
    expect(await cancelIntervention(dependencies)(actorOf("secretary"), target)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(stored()?.updatedAt).toEqual(cancelledAt);
  });

  it("does not find the intervention from another organization", async () => {
    expect(
      await cancelIntervention(dependencies)(
        actorOf("owner", { organizationId: ORGANIZATION_B }),
        target,
      ),
    ).toEqual({ isOk: false, error: "intervention_not_found" });
    expect(stored()?.status).toBe("planned");
  });

  it("refuses the cancellation to an impersonated owner", async () => {
    await expect(
      cancelIntervention(dependencies)(actorOf("owner", { isImpersonating: true }), target),
    ).rejects.toThrow(ForbiddenError);
    expect(stored()?.status).toBe("planned");
  });
});
