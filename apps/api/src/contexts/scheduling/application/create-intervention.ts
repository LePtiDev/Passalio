import { err, newId, ok, type Actor, type InterventionFields, type Result } from "@passalio/shared";
import type { Intervention } from "../domain/intervention-models";
import {
  assertCanManageInterventionOf,
  checkEquipmentsAtPlace,
  checkVisitTypes,
  newIntervention,
  teamOf,
} from "../domain/intervention-rules";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";
import { allMembers, checkedServiceLines } from "./check-visit-details";

export type CreateInterventionInput = {
  readonly id?: string | undefined;
  readonly intervention: InterventionFields;
};

export const createIntervention =
  (dependencies: SchedulingDependencies) =>
  async (
    actor: Actor,
    input: CreateInterventionInput,
  ): Promise<Result<Intervention, SchedulingError>> => {
    const { interventions, places, now } = dependencies;
    const fields = input.intervention;
    const team = teamOf(fields);
    assertCanManageInterventionOf(actor, team.technicianUserIds);
    const visitTypes = checkVisitTypes(fields.visitTypes ?? []);
    if (!visitTypes.isOk) {
      return visitTypes;
    }
    const id = input.id ?? newId();
    if (await interventions.exists(id)) {
      return err("already_exists");
    }
    const place = await places.siteOf(actor.organizationId, fields.siteId);
    if (place === undefined) {
      return err("site_not_found");
    }
    if (place.customerId !== fields.customerId) {
      return err("customer_not_found");
    }
    const equipmentIds = checkEquipmentsAtPlace(fields.equipmentIds, place);
    if (!equipmentIds.isOk) {
      return equipmentIds;
    }
    if (!(await allMembers(dependencies, actor.organizationId, team.technicianUserIds))) {
      return err("technician_not_member");
    }
    const serviceLines = await checkedServiceLines(
      dependencies,
      actor.organizationId,
      fields.serviceLines,
    );
    if (!serviceLines.isOk) {
      return serviceLines;
    }
    const intervention = newIntervention(fields, {
      id,
      organizationId: actor.organizationId,
      createdByUserId: actor.userId,
      equipmentIds: equipmentIds.value,
      visitTypes: visitTypes.value,
      serviceLines: serviceLines.value ?? [],
      team,
      at: now(),
    });
    await interventions.create(intervention);
    return ok(intervention);
  };
