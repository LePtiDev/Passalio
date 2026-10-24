import { err, ok, type Actor, type InterventionChanges, type Result } from "@passalio/shared";
import {
  assertCanManageInterventionOf,
  changedTeam,
  checkEquipmentsAtPlace,
  checkVisitTypes,
  plannedChanges,
} from "../domain/intervention-rules";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";
import { allMembers, checkedServiceLines } from "./check-visit-details";

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
    const { interventions, now } = dependencies;
    const current = await interventions.findById(actor.organizationId, input.interventionId);
    if (current === undefined) {
      return err("intervention_not_found");
    }
    assertCanManageInterventionOf(actor, current.technicianUserIds);
    const team = changedTeam(current, input.changes);
    if (team !== undefined) {
      assertCanManageInterventionOf(actor, team.technicianUserIds);
      if (!(await allMembers(dependencies, actor.organizationId, team.technicianUserIds))) {
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
    const visitTypes =
      input.changes.visitTypes === undefined
        ? ok(undefined)
        : checkVisitTypes(input.changes.visitTypes);
    if (!visitTypes.isOk) {
      return visitTypes;
    }
    const serviceLines = await checkedServiceLines(
      dependencies,
      actor.organizationId,
      input.changes.serviceLines,
    );
    if (!serviceLines.isOk) {
      return serviceLines;
    }
    const changes = plannedChanges(current, input.changes, now());
    if (!changes.isOk) {
      return changes;
    }
    await interventions.update(actor.organizationId, current.id, {
      ...changes.value,
      ...team,
      ...(equipmentIds.value === undefined ? {} : { equipmentIds: equipmentIds.value }),
      ...(visitTypes.value === undefined ? {} : { visitTypes: visitTypes.value }),
      ...(serviceLines.value === undefined ? {} : { serviceLines: serviceLines.value }),
    });
    return ok(undefined);
  };
