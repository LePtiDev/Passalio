import type { LocalDatabase } from "@/lib/db/local-database";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { visitTypesApi, type FetchVisitTypes } from "./visit-types-api";

export const saveVisitTypes = async (
  database: LocalDatabase,
  visitTypes: readonly VisitTypeRecord[],
) => {
  await database.transaction("rw", database.visitTypes, async () => {
    await database.visitTypes.clear();
    await database.visitTypes.bulkPut([...visitTypes]);
  });
};

export const refreshVisitTypes = async (
  database: LocalDatabase,
  fetchVisitTypes: FetchVisitTypes = visitTypesApi.fetchVisitTypes,
) => {
  const result = await fetchVisitTypes();
  if (result.isOk) {
    await saveVisitTypes(database, result.value.visitTypes);
  }
  return result;
};
