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
  type ServiceLine,
} from "@passalio/shared";
import { isVisitType, type TradeId } from "@passalio/trades";
import type { Intervention, InterventionChangeSet } from "./intervention-models";
import type { InterventionPlace } from "./scheduling-ports";
import type { SchedulingError } from "./scheduling-error";

type Technicians = string | readonly string[];

const listOf = (technicians: Technicians): readonly string[] =>
  typeof technicians === "string" ? [technicians] : technicians;

export const canManageInterventionOf = (actor: Actor, technicians: Technicians): boolean =>
  can(actor, "schedule:write") ||
  (can(actor, "interventions:write-own") && listOf(technicians).includes(actor.userId));

export const assertCanManageInterventionOf = (actor: Actor, technicians: Technicians): void => {
  if (!canManageInterventionOf(actor, technicians)) {
    throw new ForbiddenError("schedule:write");
  }
};

export type VisitTeam = {
  readonly technicianUserId: string;
  readonly technicianUserIds: readonly string[];
};

const teamLedBy = (lead: string, others: readonly string[]): VisitTeam => ({
  technicianUserId: lead,
  technicianUserIds: [...new Set([lead, ...others])],
});

export const teamOf = (fields: InterventionFields): VisitTeam =>
  teamLedBy(fields.technicianUserId, fields.technicianUserIds ?? []);

export const changedTeam = (
  current: VisitTeam,
  changes: InterventionChanges,
): VisitTeam | undefined => {
  const { technicianUserId, technicianUserIds } = changes;
  if (technicianUserId === undefined && technicianUserIds === undefined) {
    return undefined;
  }
  const lead = technicianUserId ?? technicianUserIds?.[0] ?? current.technicianUserId;
  return teamLedBy(
    lead,
    technicianUserIds ??
      current.technicianUserIds.filter((userId) => userId !== current.technicianUserId),
  );
};

export const checkServiceLines = (
  lines: readonly ServiceLine[],
  knownIds: readonly string[],
): Result<readonly ServiceLine[], SchedulingError> =>
  lines.every(({ serviceId }) => knownIds.includes(serviceId))
    ? ok(
        lines.filter(
          (line, index) =>
            lines.findIndex(({ serviceId }) => serviceId === line.serviceId) === index,
        ),
      )
    : err("service_not_found");

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
    readonly serviceLines?: readonly ServiceLine[];
    readonly team?: VisitTeam;
    readonly at: Date;
  },
): Intervention => ({
  id: context.id,
  organizationId: context.organizationId,
  customerId: fields.customerId,
  siteId: fields.siteId,
  ...(context.team ?? teamOf(fields)),
  scheduledDate: fields.scheduledDate,
  startTime: fields.startTime ?? null,
  durationMinutes: fields.durationMinutes,
  visitTypes: context.visitTypes ?? [],
  serviceLines: context.serviceLines ?? [],
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
  {
    visitTypes: _visitTypes,
    technicianUserId: _technicianUserId,
    technicianUserIds: _technicianUserIds,
    serviceLines: _serviceLines,
    ...changes
  }: InterventionChanges,
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
