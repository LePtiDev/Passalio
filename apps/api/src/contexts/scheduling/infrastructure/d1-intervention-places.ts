import { equipments, members, sites } from "@passalio/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { InterventionPlaces, TeamMembers } from "../domain/scheduling-ports";

export const createD1InterventionPlaces = (database: Database): InterventionPlaces => ({
  siteOf: async (organizationId, siteId) => {
    const site = await database
      .select({ customerId: sites.customerId })
      .from(sites)
      .where(
        and(
          eq(sites.organizationId, organizationId),
          eq(sites.id, siteId),
          isNull(sites.deletedAt),
        ),
      )
      .get();
    if (site === undefined) {
      return undefined;
    }
    const installed = await database
      .select({ id: equipments.id })
      .from(equipments)
      .where(
        and(
          eq(equipments.organizationId, organizationId),
          eq(equipments.siteId, siteId),
          eq(equipments.status, "active"),
          isNull(equipments.deletedAt),
        ),
      )
      .all();
    return { customerId: site.customerId, equipmentIds: installed.map(({ id }) => id) };
  },
});

export const createD1TeamMembers = (database: Database): TeamMembers => ({
  isMember: async (organizationId, userId) =>
    (await database
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.organizationId, organizationId), eq(members.userId, userId)))
      .get()) !== undefined,
});
