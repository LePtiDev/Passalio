import { newId, type InterventionFields } from "@passalio/shared";
import { isVisitType } from "@passalio/trades";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { InterventionRecord } from "@/lib/db/local-records";
import { enqueue } from "@/lib/db/outbox";
import { requestSync } from "@/lib/sync/sync-scheduler";

export type LocalActor = {
  readonly userId: string;
  readonly organizationId: string;
};

export const localIntervention = (
  fields: InterventionFields,
  context: LocalActor & { readonly id: string; readonly at: string },
): InterventionRecord => ({
  id: context.id,
  organizationId: context.organizationId,
  createdAt: context.at,
  updatedAt: context.at,
  deletedAt: null,
  customerId: fields.customerId,
  siteId: fields.siteId,
  technicianUserId: fields.technicianUserId,
  technicianUserIds: [...new Set([fields.technicianUserId, ...(fields.technicianUserIds ?? [])])],
  scheduledDate: fields.scheduledDate,
  startTime: fields.startTime ?? null,
  durationMinutes: fields.durationMinutes,
  equipmentIds: [...fields.equipmentIds],
  visitTypes: (fields.visitTypes ?? []).filter(isVisitType),
  serviceLines: [...(fields.serviceLines ?? [])],
  announcedPriceCents: fields.announcedPriceCents ?? null,
  notes: fields.notes ?? null,
  status: "planned",
  completedOn: null,
  paymentMethod: null,
  paidAmountCents: null,
  createdByUserId: context.userId,
});

export const createIntervention = async (
  database: LocalDatabase,
  actor: LocalActor,
  intervention: InterventionFields,
) => {
  const interventionId = newId();
  await database.transaction("rw", [database.interventions, database.outbox], async () => {
    await database.interventions.add(
      localIntervention(intervention, {
        ...actor,
        id: interventionId,
        at: new Date().toISOString(),
      }),
    );
    await enqueue(database, { type: "create_intervention", interventionId, intervention });
  });
  requestSync(database);
  return interventionId;
};

export const cancelIntervention = async (database: LocalDatabase, interventionId: string) => {
  await database.transaction("rw", [database.interventions, database.outbox], async () => {
    await database.interventions
      .where("id")
      .equals(interventionId)
      .modify((intervention) => {
        intervention.status = "cancelled";
        intervention.updatedAt = new Date().toISOString();
      });
    await enqueue(database, { type: "cancel_intervention", interventionId });
  });
  requestSync(database);
};
