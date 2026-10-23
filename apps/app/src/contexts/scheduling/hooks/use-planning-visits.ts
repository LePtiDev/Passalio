import { useLiveQuery } from "dexie-react-hooks";
import { useLocalSession } from "@/lib/db/local-database-context";
import { pendingEntityIds } from "@/lib/db/outbox";
import { visitsOf } from "../planning-visits";

export const usePlanningVisits = (firstDay: string, lastDay: string) => {
  const { database } = useLocalSession();
  return useLiveQuery(async () => {
    const interventions = await database.interventions
      .where("scheduledDate")
      .between(firstDay, lastDay, true, true)
      .toArray();
    const ids = (field: "customerId" | "siteId") => [
      ...new Set(interventions.map((intervention) => intervention[field])),
    ];
    const [customers, sites, equipments, documents, pending] = await Promise.all([
      database.customers.bulkGet(ids("customerId")),
      database.sites.bulkGet(ids("siteId")),
      database.equipments.bulkGet([...new Set(interventions.flatMap((row) => row.equipmentIds))]),
      database.documents
        .where("interventionId")
        .anyOf(interventions.map(({ id }) => id))
        .toArray(),
      pendingEntityIds(database),
    ]);
    const present = <Row>(rows: readonly (Row | undefined)[]) =>
      rows.filter((row) => row !== undefined);
    return visitsOf({
      interventions,
      customers: present(customers),
      sites: present(sites),
      equipments: present(equipments),
      documents,
      pending,
    });
  }, [database, firstDay, lastDay]);
};
