import { useLiveQuery } from "dexie-react-hooks";
import { useLocalSession } from "@/lib/db/local-database-context";
import { pendingEntityIds } from "@/lib/db/outbox";

export const useVisit = (interventionId: string) => {
  const { database } = useLocalSession();
  return useLiveQuery(async () => {
    const intervention = await database.interventions.get(interventionId);
    if (intervention === undefined) {
      return null;
    }
    const [customer, site, equipments, documents, pending] = await Promise.all([
      database.customers.get(intervention.customerId),
      database.sites.get(intervention.siteId),
      database.equipments.bulkGet(intervention.equipmentIds),
      database.documents.where("interventionId").equals(interventionId).toArray(),
      pendingEntityIds(database),
    ]);
    return {
      intervention,
      customer: customer ?? null,
      site: site ?? null,
      equipments: equipments.filter((equipment) => equipment !== undefined),
      documents,
      isPending: pending.has(interventionId),
    };
  }, [database, interventionId]);
};

export type VisitFile = NonNullable<ReturnType<typeof useVisit>>;
