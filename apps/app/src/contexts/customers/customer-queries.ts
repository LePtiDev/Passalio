import { normalizeSearchText } from "@passalio/shared";
import type { LocalDatabase } from "@/lib/db/local-database";

export const CUSTOMER_SEARCH_LIMIT = 50;

export const searchCustomers = (database: LocalDatabase, query: string) => {
  const prefix = normalizeSearchText(query);
  const matching =
    prefix === ""
      ? database.customers.orderBy("searchName")
      : database.customers.where("searchName").startsWith(prefix);
  return matching.limit(CUSTOMER_SEARCH_LIMIT).toArray();
};

export const customerFileOf = async (database: LocalDatabase, customerId: string) => {
  const customer = await database.customers.get(customerId);
  if (customer === undefined) {
    return undefined;
  }
  const sites = await database.sites.where("customerId").equals(customerId).sortBy("createdAt");
  const equipments = await database.equipments
    .where("siteId")
    .anyOf(sites.map(({ id }) => id))
    .sortBy("createdAt");
  const photos = await database.photos
    .where("equipmentId")
    .anyOf(equipments.map(({ id }) => id))
    .sortBy("takenAt");
  return { customer, sites, equipments, photos };
};
