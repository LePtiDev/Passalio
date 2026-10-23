import {
  err,
  ForbiddenError,
  ok,
  type Actor,
  type Result,
  type SchedulingMutation,
} from "@passalio/shared";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";
import { cancelIntervention, completeIntervention } from "./close-intervention";
import { createIntervention } from "./create-intervention";
import { updateIntervention } from "./update-intervention";

const run = (
  dependencies: SchedulingDependencies,
  actor: Actor,
  mutation: SchedulingMutation,
): Promise<Result<unknown, SchedulingError>> => {
  switch (mutation.type) {
    case "create_intervention":
      return createIntervention(dependencies)(actor, {
        id: mutation.interventionId,
        intervention: mutation.intervention,
      });
    case "update_intervention":
      return updateIntervention(dependencies)(actor, mutation);
    case "cancel_intervention":
      return cancelIntervention(dependencies)(actor, mutation);
    default:
      return completeIntervention(dependencies)(actor, mutation);
  }
};

const isAlreadyApplied = async (
  { interventions }: SchedulingDependencies,
  { organizationId }: Actor,
  mutation: SchedulingMutation,
) =>
  mutation.type === "create_intervention" &&
  (await interventions.findById(organizationId, mutation.interventionId)) !== undefined;

export const applySchedulingMutation =
  (dependencies: SchedulingDependencies) =>
  async (
    actor: Actor,
    mutation: SchedulingMutation,
  ): Promise<Result<void, SchedulingError | "forbidden">> => {
    try {
      const outcome = await run(dependencies, actor, mutation);
      if (outcome.isOk) {
        return ok(undefined);
      }
      return outcome.error === "already_exists" &&
        (await isAlreadyApplied(dependencies, actor, mutation))
        ? ok(undefined)
        : err(outcome.error);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return err("forbidden");
      }
      throw error;
    }
  };
