import { interventions } from "@passalio/db";
import { and, asc, eq, getTableColumns, gt, isNull, or } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { InterventionRepository } from "../domain/scheduling-ports";

const { deletedAt: _deletedAt, ...INTERVENTION_COLUMNS } = getTableColumns(interventions);

const activeInOrganization = (organizationId: string) =>
  and(eq(interventions.organizationId, organizationId), isNull(interventions.deletedAt));

export const createD1InterventionRepository = (database: Database): InterventionRepository => ({
  exists: async (id) =>
    (await database
      .select({ id: interventions.id })
      .from(interventions)
      .where(eq(interventions.id, id))
      .get()) !== undefined,
  create: async (intervention) => {
    await database.insert(interventions).values({
      ...intervention,
      equipmentIds: [...intervention.equipmentIds],
      visitTypes: [...intervention.visitTypes],
      technicianUserIds: [...intervention.technicianUserIds],
      serviceLines: [...intervention.serviceLines],
    });
  },
  findById: async (organizationId, interventionId) =>
    database
      .select(INTERVENTION_COLUMNS)
      .from(interventions)
      .where(and(activeInOrganization(organizationId), eq(interventions.id, interventionId)))
      .get(),
  update: async (
    organizationId,
    interventionId,
    { equipmentIds, visitTypes, technicianUserIds, serviceLines, ...changes },
  ) => {
    await database
      .update(interventions)
      .set({
        ...changes,
        ...(equipmentIds === undefined ? {} : { equipmentIds: [...equipmentIds] }),
        ...(visitTypes === undefined ? {} : { visitTypes: [...visitTypes] }),
        ...(technicianUserIds === undefined ? {} : { technicianUserIds: [...technicianUserIds] }),
        ...(serviceLines === undefined ? {} : { serviceLines: [...serviceLines] }),
      })
      .where(and(activeInOrganization(organizationId), eq(interventions.id, interventionId)));
  },
  changesAfter: async (organizationId, after, limit) =>
    database
      .select()
      .from(interventions)
      .where(
        and(
          eq(interventions.organizationId, organizationId),
          after === undefined
            ? undefined
            : or(
                gt(interventions.updatedAt, after.updatedAt),
                and(eq(interventions.updatedAt, after.updatedAt), gt(interventions.id, after.id)),
              ),
        ),
      )
      .orderBy(asc(interventions.updatedAt), asc(interventions.id))
      .limit(limit)
      .all(),
});
