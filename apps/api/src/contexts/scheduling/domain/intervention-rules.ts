import {
  can,
  err,
  ForbiddenError,
  ok,
  type Actor,
  type InterventionChanges,
  type InterventionCompletion,
  type InterventionFields,
  type Result,
} from "@passalio/shared";
import { isVisitType, type TradeId } from "@passalio/trades";
import type { Intervention, InterventionChangeSet } from "./intervention-models";
import type { InterventionPlace } from "./scheduling-ports";
import type { SchedulingError } from "./scheduling-error";

export const canManageInterventionOf = (actor: Actor, technicianUserId: string): boolean =>
  can(actor, "schedule:write") ||
  (can(actor, "interventions:write-own") && technicianUserId === actor.userId);

export const assertCanManageInterventionOf = (actor: Actor, technicianUserId: string): void => {
  if (!canManageInterventionOf(actor, technicianUserId)) {
    throw new ForbiddenError("schedule:write");
  }
};

export const checkEquipmentsAtPlace = (
  equipmentIds: readonly string[],
  place: InterventionPlace,
): Result<readonly string[], SchedulingError> =>
  equipmentIds.every((id) => place.equipmentIds.includes(id))
    ? ok([...new Set(equipmentIds)])
    : err("equipment_not_found");

export const checkVisitTypes = (
  visitTypes: readonly string[],
): Result<readonly TradeId[], SchedulingError> =>
  visitTypes.every(isVisitType) ? ok([...new Set(visitTypes)]) : err("invalid_visit_type");

export const newIntervention = (
  fields: InterventionFields,
  context: {
    readonly id: string;
    readonly organizationId: string;
    readonly createdByUserId: string;
    readonly equipmentIds: readonly string[];
    readonly visitTypes?: readonly TradeId[];
    readonly at: Date;
  },
): Intervention => ({
  id: context.id,
  organizationId: context.organizationId,
  customerId: fields.customerId,
  siteId: fields.siteId,
  technicianUserId: fields.technicianUserId,
  scheduledDate: fields.scheduledDate,
  startTime: fields.startTime ?? null,
  durationMinutes: fields.durationMinutes,
  visitTypes: context.visitTypes ?? [],
  equipmentIds: context.equipmentIds,
  announcedPriceCents: fields.announcedPriceCents ?? null,
  notes: fields.notes ?? null,
  status: "planned",
  completedOn: null,
  paymentMethod: null,
  paidAmountCents: null,
  createdByUserId: context.createdByUserId,
  createdAt: context.at,
  updatedAt: context.at,
});

export const plannedChanges = (
  current: Intervention,
  { visitTypes: _visitTypes, ...changes }: InterventionChanges,
  at: Date,
): Result<InterventionChangeSet, SchedulingError> =>
  current.status === "planned" ? ok({ ...changes, updatedAt: at }) : err("intervention_closed");

export const completionChanges = (
  current: Intervention,
  completion: InterventionCompletion,
  at: Date,
): Result<InterventionChangeSet, SchedulingError> =>
  current.status === "cancelled"
    ? err("intervention_closed")
    : ok({
        status: "completed",
        completedOn: completion.completedOn,
        paymentMethod: completion.paymentMethod ?? null,
        paidAmountCents: completion.paidAmountCents ?? null,
        updatedAt: at,
      });

export const cancellationChanges = (
  current: Intervention,
  at: Date,
): Result<InterventionChangeSet | undefined, SchedulingError> => {
  if (current.status === "completed") {
    return err("intervention_closed");
  }
  return ok(current.status === "cancelled" ? undefined : { status: "cancelled", updatedAt: at });
};
