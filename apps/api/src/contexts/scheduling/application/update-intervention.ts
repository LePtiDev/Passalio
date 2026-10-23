import { err, ok, type Actor, type InterventionChanges, type Result } from "@passalio/shared";
import {
  assertCanManageInterventionOf,
  checkEquipmentsAtPlace,
  plannedChanges,
} from "../domain/intervention-rules";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";

export type UpdateInterventionInput = {
  readonly interventionId: string;
  readonly changes: InterventionChanges;
};

const checkedEquipments = async (
  { places }: Pick<SchedulingDependencies, "places">,
  organizationId: string,
  siteId: string,
  equipmentIds: readonly string[] | undefined,
): Promise<Result<readonly string[] | undefined, SchedulingError>> => {
  if (equipmentIds === undefined) {
    return ok(undefined);
  }
  const place = await places.siteOf(organizationId, siteId);
  return place === undefined ? err("site_not_found") : checkEquipmentsAtPlace(equipmentIds, place);
};

export const updateIntervention =
  (dependencies: SchedulingDependencies) =>
  async (actor: Actor, input: UpdateInterventionInput): Promise<Result<void, SchedulingError>> => {
    const { interventions, team, now } = dependencies;
    const current = await interventions.findById(actor.organizationId, input.interventionId);
    if (current === undefined) {
      return err("intervention_not_found");
    }
    assertCanManageInterventionOf(actor, current.technicianUserId);
    const { technicianUserId } = input.changes;
    if (technicianUserId !== undefined) {
      assertCanManageInterventionOf(actor, technicianUserId);
      if (!(await team.isMember(actor.organizationId, technicianUserId))) {
        return err("technician_not_member");
      }
    }
    const equipmentIds = await checkedEquipments(
      dependencies,
      actor.organizationId,
      current.siteId,
      input.changes.equipmentIds,
    );
    if (!equipmentIds.isOk) {
      return equipmentIds;
    }
    const changes = plannedChanges(current, input.changes, now());
    if (!changes.isOk) {
      return changes;
    }
    await interventions.update(actor.organizationId, current.id, {
      ...changes.value,
      ...(equipmentIds.value === undefined ? {} : { equipmentIds: equipmentIds.value }),
    });
    return ok(undefined);
  };
