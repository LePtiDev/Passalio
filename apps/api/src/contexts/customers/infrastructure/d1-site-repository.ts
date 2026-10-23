import { sites } from "@passalio/db";
import { and, asc, eq, getTableColumns, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { SiteRepository } from "../domain/customer-ports";

const { deletedAt: _siteDeletedAt, ...SITE_COLUMNS } = getTableColumns(sites);

const activeInOrganization = (organizationId: string) =>
  and(eq(sites.organizationId, organizationId), isNull(sites.deletedAt));

export const createD1SiteRepository = (database: Database): SiteRepository => ({
  exists: async (id) =>
    (await database.select({ id: sites.id }).from(sites).where(eq(sites.id, id)).get()) !==
    undefined,
  create: async (site) => {
    await database.insert(sites).values(site);
  },
  findById: async (organizationId, siteId) =>
    database
      .select(SITE_COLUMNS)
      .from(sites)
      .where(and(activeInOrganization(organizationId), eq(sites.id, siteId)))
      .get(),
  update: async (organizationId, siteId, changes) => {
    await database
      .update(sites)
      .set(changes)
      .where(and(activeInOrganization(organizationId), eq(sites.id, siteId)));
  },
  listByCustomer: async (organizationId, customerId) =>
    database
      .select(SITE_COLUMNS)
      .from(sites)
      .where(and(activeInOrganization(organizationId), eq(sites.customerId, customerId)))
      .orderBy(asc(sites.createdAt))
      .all(),
});
