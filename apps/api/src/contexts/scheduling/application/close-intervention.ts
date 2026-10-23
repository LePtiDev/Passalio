import { err, ok, type Actor, type InterventionCompletion, type Result } from "@passalio/shared";
import {
  assertCanManageInterventionOf,
  cancellationChanges,
  completionChanges,
} from "../domain/intervention-rules";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";

type Dependencies = Pick<SchedulingDependencies, "interventions" | "now">;

export const completeIntervention =
  ({ interventions, now }: Dependencies) =>
  async (
    actor: Actor,
    input: { readonly interventionId: string; readonly completion: InterventionCompletion },
  ): Promise<Result<void, SchedulingError>> => {
    const current = await interventions.findById(actor.organizationId, input.interventionId);
    if (current === undefined) {
      return err("intervention_not_found");
    }
    assertCanManageInterventionOf(actor, current.technicianUserId);
    const changes = completionChanges(current, input.completion, now());
    if (!changes.isOk) {
      return changes;
    }
    await interventions.update(actor.organizationId, current.id, changes.value);
    return ok(undefined);
  };

export const cancelIntervention =
  ({ interventions, now }: Dependencies) =>
  async (
    actor: Actor,
    input: { readonly interventionId: string },
  ): Promise<Result<void, SchedulingError>> => {
    const current = await interventions.findById(actor.organizationId, input.interventionId);
    if (current === undefined) {
      return err("intervention_not_found");
    }
    assertCanManageInterventionOf(actor, current.technicianUserId);
    const changes = cancellationChanges(current, now());
    if (!changes.isOk) {
      return changes;
    }
    if (changes.value !== undefined) {
      await interventions.update(actor.organizationId, current.id, changes.value);
    }
    return ok(undefined);
  };
