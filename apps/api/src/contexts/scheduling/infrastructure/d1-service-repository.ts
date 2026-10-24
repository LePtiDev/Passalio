import { services } from "@passalio/db";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { ServiceCatalog } from "../domain/scheduling-ports";
import type { ServiceRepository } from "../domain/service-models";

const SERVICE_COLUMNS = {
  id: services.id,
  organizationId: services.organizationId,
  name: services.name,
  durationMinutes: services.durationMinutes,
  priceCents: services.priceCents,
  document: services.document,
  trade: services.trade,
  archivedAt: services.archivedAt,
  createdAt: services.createdAt,
  updatedAt: services.updatedAt,
};

const activeInOrganization = (organizationId: string) =>
  and(eq(services.organizationId, organizationId), isNull(services.archivedAt));

export const createD1ServiceRepository = (database: Database): ServiceRepository => ({
  listActive: async (organizationId) =>
    database
      .select(SERVICE_COLUMNS)
      .from(services)
      .where(activeInOrganization(organizationId))
      .orderBy(asc(services.createdAt), asc(services.id))
      .all(),
  findActive: async (organizationId, serviceId) =>
    database
      .select(SERVICE_COLUMNS)
      .from(services)
      .where(and(activeInOrganization(organizationId), eq(services.id, serviceId)))
      .get(),
  create: async (service) => {
    await database.insert(services).values(service);
  },
  update: async (organizationId, serviceId, changes) => {
    await database
      .update(services)
      .set(changes)
      .where(and(activeInOrganization(organizationId), eq(services.id, serviceId)));
  },
  archive: async (organizationId, serviceId, at) => {
    await database
      .update(services)
      .set({ archivedAt: at, updatedAt: at })
      .where(and(activeInOrganization(organizationId), eq(services.id, serviceId)));
  },
});

export const createD1ServiceCatalog = (database: Database): ServiceCatalog => ({
  knownIds: async (organizationId, serviceIds) =>
    (
      await database
        .select({ id: services.id })
        .from(services)
        .where(
          and(eq(services.organizationId, organizationId), inArray(services.id, [...serviceIds])),
        )
        .all()
    ).map(({ id }) => id),
});
