import { customers, equipmentPhotos, equipments, sites } from "@passalio/db";
import { and, asc, eq, getTableColumns, gt, gte, inArray, isNull, lt, or } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { CustomerRepository } from "../domain/customer-ports";

const { deletedAt: _customerDeletedAt, ...CUSTOMER_COLUMNS } = getTableColumns(customers);

const activeInOrganization = (organizationId: string) =>
  and(eq(customers.organizationId, organizationId), isNull(customers.deletedAt));

export const createD1CustomerRepository = (database: Database): CustomerRepository => ({
  exists: async (id) =>
    (await database
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, id))
      .get()) !== undefined,
  create: async (customer, site) => {
    await (site === undefined
      ? database.insert(customers).values(customer)
      : database.batch([
          database.insert(customers).values(customer),
          database.insert(sites).values(site),
        ]));
  },
  findById: async (organizationId, customerId) =>
    database
      .select(CUSTOMER_COLUMNS)
      .from(customers)
      .where(and(activeInOrganization(organizationId), eq(customers.id, customerId)))
      .get(),
  update: async (organizationId, customerId, changes) => {
    await database
      .update(customers)
      .set(changes)
      .where(and(activeInOrganization(organizationId), eq(customers.id, customerId)));
  },
  archive: async (organizationId, customerId, at) => {
    const archived = { deletedAt: at, updatedAt: at };
    const customerSites = database
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.organizationId, organizationId), eq(sites.customerId, customerId)));
    const customerEquipments = database
      .select({ id: equipments.id })
      .from(equipments)
      .where(
        and(
          eq(equipments.organizationId, organizationId),
          inArray(equipments.siteId, customerSites),
        ),
      );
    await database.batch([
      database
        .update(equipmentPhotos)
        .set(archived)
        .where(
          and(
            eq(equipmentPhotos.organizationId, organizationId),
            inArray(equipmentPhotos.equipmentId, customerEquipments),
            isNull(equipmentPhotos.deletedAt),
          ),
        ),
      database
        .update(equipments)
        .set(archived)
        .where(
          and(
            eq(equipments.organizationId, organizationId),
            inArray(equipments.siteId, customerSites),
            isNull(equipments.deletedAt),
          ),
        ),
      database
        .update(sites)
        .set(archived)
        .where(
          and(
            eq(sites.organizationId, organizationId),
            eq(sites.customerId, customerId),
            isNull(sites.deletedAt),
          ),
        ),
      database
        .update(customers)
        .set(archived)
        .where(and(activeInOrganization(organizationId), eq(customers.id, customerId))),
    ]);
  },
  list: async (organizationId, { limit, after, range }) =>
    database
      .select({
        id: customers.id,
        kind: customers.kind,
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        phone: customers.phone,
        email: customers.email,
        updatedAt: customers.updatedAt,
        searchName: customers.searchName,
      })
      .from(customers)
      .where(
        and(
          activeInOrganization(organizationId),
          range === undefined
            ? undefined
            : and(gte(customers.searchName, range.from), lt(customers.searchName, range.to)),
          after === undefined
            ? undefined
            : or(
                gt(customers.searchName, after.searchName),
                and(eq(customers.searchName, after.searchName), gt(customers.id, after.id)),
              ),
        ),
      )
      .orderBy(asc(customers.searchName), asc(customers.id))
      .limit(limit)
      .all(),
});
