import { equipments, interventions } from "@passalio/db";
import type { EquipmentDetails } from "@passalio/trades";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { SigningTargets } from "../domain/compliance-ports";

const flueTypeOf = (details: EquipmentDetails) =>
  "flueType" in details ? (details.flueType ?? null) : null;

export const createD1SigningTargets = (database: Database): SigningTargets => ({
  interventionOf: async (organizationId, interventionId) =>
    database
      .select({ status: interventions.status, equipmentIds: interventions.equipmentIds })
      .from(interventions)
      .where(
        and(
          eq(interventions.organizationId, organizationId),
          eq(interventions.id, interventionId),
          isNull(interventions.deletedAt),
        ),
      )
      .get(),
  equipmentOf: async (organizationId, equipmentId) => {
    const equipment = await database
      .select({
        kind: equipments.kind,
        details: equipments.details,
        lastSweepingOn: equipments.lastSweepingOn,
      })
      .from(equipments)
      .where(
        and(
          eq(equipments.organizationId, organizationId),
          eq(equipments.id, equipmentId),
          isNull(equipments.deletedAt),
        ),
      )
      .get();
    return equipment === undefined
      ? undefined
      : {
          kind: equipment.kind,
          flueType: flueTypeOf(equipment.details),
          lastSweepingOn: equipment.lastSweepingOn,
        };
  },
});
