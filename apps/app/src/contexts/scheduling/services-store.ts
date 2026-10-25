import type { LocalDatabase } from "@/lib/db/local-database";
import type { ServiceRecord } from "@/lib/db/local-records";
import { servicesApi, type FetchServices } from "./services-api";

export const saveServices = async (database: LocalDatabase, services: readonly ServiceRecord[]) => {
  await database.transaction("rw", database.services, async () => {
    await database.services.clear();
    await database.services.bulkPut([...services]);
  });
};

export const refreshServices = async (
  database: LocalDatabase,
  fetchServices: FetchServices = servicesApi.fetchServices,
) => {
  const result = await fetchServices();
  if (result.isOk) {
    await saveServices(database, result.value.services);
  }
  return result;
};
