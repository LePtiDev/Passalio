import { err, newId, ok, type Actor, type InterventionFields, type Result } from "@passalio/shared";
import type { Intervention } from "../domain/intervention-models";
import {
  assertCanManageInterventionOf,
  checkEquipmentsAtPlace,
  checkVisitTypes,
  newIntervention,
} from "../domain/intervention-rules";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";

export type CreateInterventionInput = {
  readonly id?: string | undefined;
  readonly intervention: InterventionFields;
};

export const createIntervention =
  ({ interventions, places, team, now }: SchedulingDependencies) =>
  async (
    actor: Actor,
    input: CreateInterventionInput,
  ): Promise<Result<Intervention, SchedulingError>> => {
    const fields = input.intervention;
    assertCanManageInterventionOf(actor, fields.technicianUserId);
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
    if (!(await team.isMember(actor.organizationId, fields.technicianUserId))) {
      return err("technician_not_member");
    }
    const intervention = newIntervention(fields, {
      id,
      organizationId: actor.organizationId,
      createdByUserId: actor.userId,
      equipmentIds: equipmentIds.value,
      visitTypes: visitTypes.value,
      at: now(),
    });
    await interventions.create(intervention);
    return ok(intervention);
  };
